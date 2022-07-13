import { EventEmitter } from "events"
import * as zip from "@zip.js/zip.js"
import convert from "xml-js";
import removeChildsWith from "./removeChildsWithSelectors.js";
import RootPath from "./RootPath";
import EV from "./EV"
import * as trait from "./traits";
import BookCache from "./BookCache";
import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { parseSpine } from "./parseSpine";
import { parseManifest } from "./parseManifest";
import { parseMetadata } from "./parseMetadata";
import { parseFlow } from "./parseFlow";
import { walkNavMap } from "./walknavMap";
import { walkTOC } from "./walkTOC";
import {MIMEError} from "./error/MIMEError"

export {EV} from "./EV"
export type UnaryFX<T, RT> = (v:T) => RT;
export type maybeChapterTransformerSignature = null | UnaryFX<DocumentFragment, HTMLElement>;
export default class Epub extends EventEmitter {
    info: trait.Info = {
        archive:null,
        container:null,
        mime:null,
        rootName:null
    }
    metadata: trait.Metadata;
    manifest: trait.Manifest = {}
    spine: trait.Spine;
    flow = new trait.Flow();
    toc = new trait.TableOfContents()
    toc_type:string;
    chapterTransformer: maybeChapterTransformerSignature;
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
    chapterTransformer: maybeChapterTransformerSignature  = null) {
        super();
        this.info.archive = archive
        this.chapterTransformer = chapterTransformer;
    }

    error(msg: string) {
        this.throw(new Error(msg))
    }

    throw(err: Error) {
        this.emit("error", err)
    }

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
            new Error(zip.ERR_ABORT + " no files in archive!")
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

    async readFile(name:string, writer:trait.ChapterType=trait.ChapterType.text):Promise<trait.LoadedEntry> {
        const file = await this.getFileInArchive(name);
        const w = this.determineWriter(writer);

        /* @TS-IGNORE 
         * Though there's a warning, it does not show which var is the _object_ as such just ignore it for now. The code below _works_ as far as the previous js ver was.
         */
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

        const { "full-path": fullPath, "media-type": mediaType }:{"full-path":string, "media-type": string} =
            container.rootfiles.rootfile._attributes;

        const expected = "application/oebps-package+xml"
        if (mediaType != expected) {
            throw MIMEError.format({id:ID, actual:mediaType, expected})
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
    determineWriter(t:trait.ChapterType) {
        switch (t) {
            case trait.ChapterType.image:
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
        this.metadata = parseMetadata(pkg.metadata)
        this.emit(EV.metadata)

        this.manifest = parseManifest(pkg.manifest.item, this.rootPath)
        this.emit(EV.manifest)

        this.spine = parseSpine(pkg.spine, this.manifest)
        this.emit(EV.spine)

        this.flow = parseFlow(this.spine.contents);
        this.emit(EV.flow)

        const {toc, type} = await this.parseTOC(this.manifest, this.spine.toc)
        this.toc = toc
        this.toc_type = type;
        this.emit(EV.toc)
        this.emit(EV.loaded)
    }
    async parseTOC(manifest:trait.Manifest, toc_id:string) {
        let toc:trait.TableOfContents|undefined;
        let tocElem = manifest[toc_id] || manifest["toc"]
        const hasNCX = Boolean(tocElem.id == "ncx")
        const IDs = {};
        Object.entries(manifest).map(([k, v]) => {
            IDs[v.href] = k;
        })
        
        /*TODOS
         * 1. Decouple xml part so this fx could be declared in its own file.
         */
        const xml = await this.zip2JS(tocElem.href);
        if (hasNCX) {
            const path = tocElem.href.split("/")
            path.pop();
            toc = walkNavMap(
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

        return {type:tocElem.id, toc: matchTOCWithManifest(toc, manifest)}
    }

    /**
     *  Parses the tree to see if there's an encryption file, signifying the presence of DRM
     *  see: https://stackoverflow.com/questions/14442968/how-to-check-if-an-epub-file-is-drm-protected
     **/
    hasDRM () {
        const drmFile = 'META-INF/encryption.xml';
        return Object.keys(this.entries).includes(drmFile);
    }

    /**
    * Gets the text from a file based on id. 
    * Replaces image and link URL's
    * and removes <head> etc. elements. 
    * If the chapterTransformer function is set, will pass it to the root element before returning.
    * @param {string} id :Manifest id of the file
    * @returns {Promise<string>} : Chapter text for mime type application/xhtml+xml
    */
    async getContent(id:string): Promise<string> {
        if (Object.keys(this.cache.text).includes(id))
            return this.cache.text[id];

        let str = await this.getContentRaw(id);
            
        const frag = ((text:string) => {
            const p = new DOMParser()
            let xmlD = p.parseFromString(text, "application/xhtml+xml");
            const b = xmlD.querySelector("body")
            if (b == null) {
                throw new Error("No body tag for ID: " + id)
            }

            const f = document.createElement("template")
            f.innerHTML = b.outerHTML;
            removeChildsWith(b, "script", "style");
            return f.content;
        })(str);

        const onEvent = /^on.+/i;
        //TODO: Convert for loops to .forEach for possible speed gains
        for (const elem of frag.querySelectorAll("*")) {
            for (const {name} of elem.attributes) {
                if (onEvent.test(name))
                    elem.removeAttribute(name);
            }
        }

        //Replaces chapter links with the ids that can be used for referral in the TOC.
        for (const a of frag.querySelectorAll("a")) {
            a.href = a.href
                .replace(/\.x?html?.+/, "") // Remove file extension
                .replace(/(t|T)ext\//, "#") // Remove subpath "text" and add ID anchor.
            const _id = a.hash.slice(1);

            for (const k in this.manifest) {
                if (k.includes(_id)) {
                    a.href = '#' + k
                    break;
                }
            }
        }

        //Replace SVG <image> with <img>
        for (const svg of frag.querySelectorAll("svg")) {
            const image = svg.querySelector("image")
            if (!image)
                continue;

            const img = new Image();

            //TS: null vs undefined
            img.dataset.src = image.getAttribute("xlink:href") || undefined;
            svg.parentNode?.replaceChild(img, svg)
        }

        for (const img of frag.querySelectorAll("img")) {
            //TODO: Allow a default image to be used when no src.
            const src = this.rootPath.alter(img.src || img.dataset.src ||"unknown")
            img.dataset.src = src;
            for(const _id in this.manifest) {
                if(src == this.manifest[_id].href) {
                    img.src = await this.getImage(_id);
                }
            }
        }

        /**TODOS:
         * 1. Compare with UnaryFX instead
         * 2. Replace str with the frag state before calling chapterTransformer
         */
        if (this.chapterTransformer instanceof Function) {
            try {
                str = this.chapterTransformer(frag).innerHTML;
            } catch(e) {
                console.log("Transform failed: ", id, e);
            }
        }

        this.cache.setText(id, str)
        return str
        }

    /**
     * @param {string} id :Manifest id value for the content
     * @returns {Promise<string>} : Raw Chapter text for mime type application/xhtml+xml
     **/
    private async getContentRaw(id:string):Promise<string> {
        const elem = this.manifest[id] || null
        
        if (elem == null)
            return "";
    
        const allowedMIMETypes = /^(application\/xhtml\+xml|image\/svg\+xml)$/i;
        const actual = elem["media-type"]
        const wrong = !allowedMIMETypes.test(actual)
        if (wrong)
            throw MIMEError.format({id, expected:allowedMIMETypes.source, actual})

        return (await this.readFile(elem.href)).data as string;
    }

    /**
     *  Return only images with mime type image
     * @param {string} id of the image file in the manifest
     * @returns {Promise<string>} Returns a promise of the image as a blob if it has a proper mime type.
     */
    async getImage(id:string): Promise<string> {
        if(this.cache.image[id])
            return this.cache.image[id];

        const item = this.manifest[id] || null;
        const TE = new TypeError(`Undefined manifest entry: ${id}`)
        if (item == null)
            throw TE;

        const expected = /^image\//i;
        const actual = item["media-type"].trim();
        const match = expected.test(actual)
        if (!match) {
            throw MIMEError.format({id, expected:expected.source, actual})
        }

        const data = (await this.readFile(item.href, trait.ChapterType.image)).data as Blob

        const r = new FileReader();
        return new Promise<string>((resolve, reject) => {
            r.onload = (e) => {
                let res = e.target?.result || null;
                if (res == null) {
                    reject(r.error);
                    return
                }

                res = res.toString()
                this.cache.setImage(id, res)
                resolve(res)
            }

            r.onerror = () => reject(r.error);

            r.readAsDataURL(data)
        })
    }
}