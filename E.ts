import { EventEmitter } from "events"
import * as zip from "@zip.js/zip.js"
import convert from "xml-js";
import toArray from "./toArray.js"
import removeChildsWith from "./removeChildsWithSelectors.js";
import RootPath from "./RootPath.js";
import EV from "./EV"
import * as trait from "./traits";
import { Thing } from "./traits";
import BookCache from "./BookCache.js";
import { dotToScore } from "./dotToScore";
import { walkTOC } from "./walkTOC.js";
import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { parseSpine } from "./parseSpine";
export default class Epub extends EventEmitter {
    info: trait.FileInfo = {
        archive:null,
        container:null,
        mime:null,
        rootName:null
    }
    metadata: trait.Metadata;
    manifest: Object = {}
    spine: trait.Spine;
    flow = new Map()
    toc = new trait.TableOfContents()
    chapterTransformer: Function
    cache = new BookCache()
    reader: zip.ZipReader<Blob>
    entries: zip.Entry[]
    conversionOptions:convert.Options.XML2JSON = {
        compact:true,
        spaces:4
    }
    rootPath:RootPath;
    rootXML: convert.ElementCompact;
    version: string;

    constructor
    (archive: File, 
    chapterTransformer: null | ((df:DocumentFragment) => HTMLElement)
    ) {
        super();
        this.info.archive = archive
    }

    error(msg: string) {
        this.throw(new Error(msg))
    }

    throw(err: Error) {
        this.emit("error", err)
    }

    /* errorMIME(id: string, expected: string, actual: string) {
        this.throw(new MIMEError(`Item with id: ${id} expected to ${expected} but was actually ${actual}`))
    }
 */
    /**
 *  Extracts the epub files from a zip archive, retrieves file listing
 *  and runs mime type check. May optionally set event listeners with a Map. Note that "this" will be bounded to the Epub instance so it is suggested to use the Function keyword instead of arrow funcs. 
 **/
    async open(load_events: Map<EV, Function> | null = null) {
        if (this.info.archive == null)
            return;

        this.reader = new zip.ZipReader(new zip.BlobReader(this.info.archive))

        if (load_events instanceof Map) {
            for (const [ev, cb] of load_events) {
                this.on(ev, cb.bind(this))
            }
        }

        // get all entries from the zip
        this.entries = await this.reader.getEntries();

        // close the ZipReader
        await this.reader.close();

        if (this.entries)
            this.checkMimeType();
        else
            this.error("No files in archive");
    }

    /**
     *  Checks if there's a file called "mimetype" and that it's contents
     *  are "application/epub+zip". On success, runs root file check.
     **/
    async checkMimeType() {
        const target = "application/epub+zip";
        const id = "mimetype";
        const {file, data} = await this.readFile(id)
        this.info.mime = file;
        if (data != target) {
            throw new TypeError("Incorrect mime")
        }
        this.getRootFiles()
    }

    async readFile(name:string, writer="text"):Promise<trait.LoadedEntry> {
        const file = await this.getFileInArchive(name);
        const w = this.determineWriter(writer);
        //TS ignore
        return {
            file, 
            data: await file.getData(w)
        }
    }

    /*  */
    /**
     *  Looks for a "meta-inf/container.xml" file and searches for a
     *  rootfile element with mime type "application/oebps-package+xml".
     *  On success, calls the rootfile parser
     **/
    async getRootFiles() {
        if (this.info== undefined) {
            this.error("No container file");
        }
        const ID = "meta-inf/container.xml"
        const maybeContainer = await this.readFile(ID);

        this.info.container = maybeContainer

        const { container } = this.xml2js(this.info.container.data
            .toString()
            .toLowerCase()
            .trim()
        )

        if (!container.rootfiles || !container.rootfiles.rootfile) 
            this.error("No rootfiles found");

        const { "full-path": fullPath, "media-type": mediaType } =
            container.rootfiles.rootfile._attributes;

        const MIME = "application/oebps-package+xml"
        if (mediaType != MIME) {
            this.errorMIME(ID, MIME, mediaType)
        }

        this.info.rootName = fullPath
        this.rootPath = new RootPath(fullPath);

        this.handleRootFile();
    }
    async handleRootFile() {
        if (this.info.rootName == null)
            return;

        const maybeLoadedEntry = await this.readFile(this.info.rootName)
        this.rootXML = this.xml2js(maybeLoadedEntry.data.toString())
        this.emit(EV.root)
    }

    /**
     * @returns the appropriate zip writer
     */
    determineWriter(w: string="text") {
        switch (w) {
            case "image":
                return new zip.BlobWriter("image/*")
            default:
                return new zip.TextWriter("utf-8")
        }
    }
    async getFileInArchive(name: string, isCaseSensitive = false): Promise<zip.Entry> {
        //Remove leading / for paths
        let fn = name[0] == '/' ? name.slice(1) : name;
        if (isCaseSensitive == false) {
            fn = fn.toLowerCase()
        }

        for (const entry of this.entries) {
            if (entry.directory)
                continue;

            //Allow partial matches
            let eFN = entry.filename;
            if (isCaseSensitive == false) {
                eFN = eFN.toLowerCase()
            }

            if (eFN.includes(fn) || fn.includes(eFN))
                return entry
        }

        throw new Error(zip.ERR_INVALID_ENTRY_NAME);
    }

    /**
     * Converts text to Object
     */
    xml2js(data:string):convert.ElementCompact {
        //MAYBEISSUE: #1: prev version XML2JS
        return convert.xml2js(data, this.conversionOptions)
    }

    async zip2JS(name:string) {
        const {data} = await this.readFile(name);
        return this.xml2js(data as string);
    }
    async parseRootFile({package:pkg}:{package:trait.RootFile}) {
        this.version = pkg._attributes.version || "2.0";
        this.metadata = this.parseMetadata(pkg.metadata)
        this.emit(EV.metadata)

        this.manifest = this.parseManifest(pkg.manifest.item)
        this.emit(EV.manifest)

        this.spine = parseSpine(pkg.spine, this.manifest)
        this.emit(EV.spine)

        this.flow = this.parseFlow(this.spine.contents);
        this.emit(EV.flow)

        const result = await this.parseTOC(this.manifest, this.spine.toc)
        this.toc = result.toc
        console.log(result.hasNCX ? "NCX":"OPF", this.toc);
        this.emit(EV.toc)
        
        this.emit(EV.loaded)
    }
    async parseTOC(manifest:trait.Manifest, toc_id:string) {
        const hasNCX = Boolean(toc_id)
        let toc:trait.TableOfContents|undefined, 
        tocElem = manifest[
            (hasNCX) ? toc_id:"toc"
        ]
        
        const IDs = {};
        Object.entries(manifest).map(([k, v]) => {
            IDs[v.href] = k;
        })
        
        //TODO: error msg
        const xml = await this.zip2JS(tocElem.href);
        if (hasNCX) {
            const path = tocElem.href.split("/")
            path.pop();
            toc = this.walkNavMap(
                {
                branch: xml.ncx.navMap.navPoint,
                path, 
                IDs,
                level:0
                }
                , manifest
            )
        } else {
            toc = walkTOC(xml.html.body, manifest);
        }

        if(toc == undefined)
            throw new TypeError(`NO TOC found for id: ${toc_id}, input: ${manifest}`);

        return {hasNCX, toc: matchTOCWithManifest(toc, manifest)}
    }

    parseFlow(contents: any[]): Map<any, any> {
        throw new Error("Method not implemented.");
    }

    parseManifest(items: any[]): trait.Manifest {
        const manifest:trait.Manifest = {}
        for(const item of items) {
            const elem:trait.Item = item._attributes
            elem.href = this.rootPath.alter(elem.href)
            elem.id = dotToScore(elem.id)
            manifest[elem.id] = elem
        }

        return manifest;
    }
    /**
     * Emits a "parsed-metadata" event
     */
     parseMetadata(_metadata:trait.Metadata) {
        const metadata:trait.Metadata = {
            creator:"",
            UUID:"",
            ISBN:""
        };
        for(const [k,v] of Object.entries(_metadata)) {
            const 
                keyparts = k.split(":"),
                key = (keyparts[keyparts.length-1] || "").toLowerCase().trim(),
                text = "" + v._text
            ;
            
            switch (key) {
                case "creator":
                    if (Array.isArray(v)) {
                        metadata.creator = v.map(item => {
                            return item._text
                        }).join(" | ")
                    } else {
                        metadata.creator = text
                    }
                    break;
                case "identifier":
                    if(Array.isArray(v)) {
                        metadata.UUID = this.extractUUID(v[0]._text)
                    } else if (v["opf:scheme"] == "ISBN") {
                        metadata.ISBN = text;
                    } else {
                        metadata.UUID = this.extractUUID(text)
                    }
                    
                    break;
                default:
                    metadata[key] = text;
            }
        }

        return metadata;
    }

    /**
     * Helper function for parsing metadata
     */
    extractUUID(txt:string|any):string {
        if (typeof txt == "string") {
            txt = txt.toLowerCase()
            let parts = txt.split(":")
            if (parts.includes("uuid"))
                return parts[parts.length - 1];
        }
    
        return ""
    }

    walkNavMap
    ({branch, path, IDs, level = 0}:trait.Nav.Node, 
    manifest:trait.Manifest
    ) {
        // don't go too deep
        if (level > 7)
            return undefined;
        const output:trait.TableOfContents = new trait.TableOfContents();
        
        for (const part of toArray(branch)) {
            let title = "";
                
            if (part.navLabel)
                title = (part.navLabel.text._text || part.navLabel).trim()

            let order = Number(part._attributes.playOrder) || 0

            let href:string = part.content._attributes.src;

            if (href == null)
                continue;
            else
                href = href.trim();

            let element:trait.Nav.Leaf = {
                level: level,
                order: order,
                title: title,
            };

            element.href = path.concat([href]).join("/");

            const id = IDs[element.href] || null

            if (id == null) // use new one
                element.id = (part._attributes.id || "").trim();
            else { // link existing object
                element = {... manifest[id], title, order, level};
                element.id = element.id.replace('.','_')
                element.navPoint = (part.navPoint) ?
                    this.walkNavMap(
                        {
                            "branch": part.navPoint,
                            path, 
                            IDs,
                            level: level + 1
                        }
                        , manifest
                    )
                    : undefined;
            }

            output.set(element.id, element)
        }

        return output;
    }
}