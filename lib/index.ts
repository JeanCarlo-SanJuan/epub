import * as zip from "@zip.js/zip.js"
import * as convert from "@jcsj/xml-js";
import RootPath from "./RootPath";
import EV from "./EV"
import * as trait from "./traits";
import BookCache from "./BookCache";
import { parseSpine } from "./parseSpine";
import { parseManifest } from "./parseManifest";
import { parseMetadata } from "./parseMetadata";
import { parseFlow } from "./parseFlow";
import { MIMEError } from "./error/MIMEError"
import { xmlToFragment } from "./xmlToFragment";
import { removeInlineEvents } from "./removeInlineEvents";
import { replaceSVGImageWithIMG } from "./replaceSVGWithIMG";
import { matchAnchorsWithTOC } from "./matchAnchorsWithTOC";
import { TableOfContents } from "./toc/TableOfContents";
import { parseTOC } from "./toc/parseTOC";
import { UnknownItemError } from "./error/UnkownItemError";
export { EV } from "./EV"
export type UnaryFX<T, RT> = (v: T) => RT;
export type maybeChapterTransformer = null | UnaryFX<DocumentFragment, HTMLElement>;

export type EPUBProgressEvents = {
    [key in EV]?: Function;
};

export class Epub {
    info: trait.Info = {
        archive: null,
        container: null,
        mime: null,
        rootName: null
    }
    metadata: trait.Metadata | undefined;
    manifest: trait.Manifest = {}
    spine: trait.Spine | undefined;
    flow = new trait.Flow();
    toc = new TableOfContents()
    chapterTransformer: maybeChapterTransformer;
    cache = new BookCache()
    reader: zip.ZipReader<Blob> | undefined
    entries: zip.Entry[] = []
    conversionOptions: convert.Options.XML2JSON = {
        compact: true,
        spaces: 4
    }
    rootPath!: RootPath;
    rootXML: convert.ElementCompact = {};
    version: string = "";
    progressEvents: EPUBProgressEvents = {};

    constructor
        (archive: File,
            chapterTransformer: maybeChapterTransformer = null) {
        this.info.archive = archive
        this.chapterTransformer = chapterTransformer;
    }
    emit(ev: EV) {
        this.progressEvents[ev]?.()
    }
    /**
     *  Extracts the epub files from a zip archive, retrieves file listing
     *  and runs mime type check. May optionally set event listeners with an object whose keys denotes the 'event name' while the value must be a function. "this" shall be bounded to the 'Epub' instance. 
     **/
    async open(p: EPUBProgressEvents = {}) {
        this.progressEvents = p
        if (this.info.archive == null)
            return;

        this.reader = new zip.ZipReader(new zip.BlobReader(this.info.archive))

        // get all entries from the zip
        this.entries = await this.reader.getEntries();

        // close the ZipReader
        await this.reader.close();

        if (this.entries.length) {
            await this.checkMimeType();
            this.getRootFiles()
        }
        else
            new Error("Empty archive!")
    }

    /**
     *  Finds a file named "mimetype" and check if the content
     *  is exactly "application/epub+zip".
     **/
    async checkMimeType() {
        const id = "mimetype";
        const { file, data } = await this.readFile(id)
        this.info.mime = file;
        MIMEError.unless({ id, actual: data as string, expected: "application/epub+zip" })
    }

    async readFile(name: string, writer: trait.ChapterType = trait.ChapterType.text): Promise<trait.LoadedEntry> {
        const file = await this.getFileInArchive(name);
        const w = this.determineWriter(writer);

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
        if (this.info == undefined)
            throw TypeError("No container file");

        const id = "meta-inf/container.xml"
        const maybeContainer = await this.readFile(id);

        this.info.container = maybeContainer
        const { container } = this.xml2js(this.info.container.data
            .toString()
            .toLowerCase()
            .trim()
        )

        if (!container.rootfiles || !container.rootfiles.rootfile)
            throw TypeError("No rootfiles found");

        const d: { "full-path": string, "media-type": string } =
            container.rootfiles.rootfile._attributes;

        MIMEError.unless({ id, actual: d["media-type"], expected: "application/oebps-package+xml" })

        this.info.rootName = d["full-path"]
        this.rootPath = new RootPath(d["full-path"]);

        this.handleRootFile();
    }
    async handleRootFile() {
        if (this.info.rootName == null)
            return;

        const entry = await this.readFile(this.info.rootName)
        this.rootXML = this.xml2js(entry.data.toString())
        this.emit(EV.root)
    }

    /**
     * @returns the appropriate zip writer
     */
    determineWriter(t: trait.ChapterType) {
        switch (t) {
            case trait.ChapterType.image:
                return new zip.BlobWriter("image/*")
            default:
                return new zip.TextWriter("utf-8")
        }
    }
    async getFileInArchive(name: string, isCaseSensitive = false): Promise<zip.Entry> {
        //Remove leading / for paths
        let fn = decodeURI(name[0] == '/' ? name.slice(1) : name);
        if (isCaseSensitive == false) {
            fn = fn.toLowerCase()
        }
        const entry = this.entries.find((n) => {
            if (n.directory)
                return false;

            //Allow partial matches
            let eFN = n.filename;
            if (isCaseSensitive == false) {
                eFN = eFN.toLowerCase()
            }

            return eFN.includes(fn) || fn.includes(eFN)
        })

        if (entry)
            return entry;

        throw new Error(`Could not find entry with name ${name}, "extracted filename was ${fn}`);
    }

    /**
     * Converts xml data to Object
     */
    xml2js(data: string): convert.ElementCompact {
        return convert.xml2js(data, this.conversionOptions)
    }

    async zip2JS(name: string) {
        const { data } = await this.readFile(name);
        return this.xml2js(data as string);
    }
    async parseRootFile({ package: pkg }: { package: trait.RootFile }) {
        this.version = pkg._attributes.version || "2.0";
        this.metadata = parseMetadata(pkg.metadata)
        this.emit(EV.metadata)

        this.manifest = parseManifest(pkg.manifest.item, this.rootPath)
        this.emit(EV.manifest)

        this.spine = parseSpine(pkg.spine, this.manifest)
        this.emit(EV.spine)

        this.flow = parseFlow(this.spine.contents);
        this.emit(EV.flow)

        this.toc = await parseTOC(this.manifest, this.spine.toc, this)

        if (this.toc) {
            this.emit(EV.toc)
            this.emit(EV.loaded)
        } else {
            throw TypeError("NO TOC")
        }
    }

    /**
     *  Parses the tree to see if there's an encryption file, signifying the presence of DRM
     *  see: https://stackoverflow.com/questions/14442968/how-to-check-if-an-epub-file-is-drm-protected
     **/
    hasDRM() {
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
    async getContent(id: string): Promise<string> {
        if (Object.keys(this.cache.text).includes(id))
            return this.cache.text[id];

        let str = await this.getContentRaw(id);
        const frag = xmlToFragment(str, id);
        removeInlineEvents(frag);
        matchAnchorsWithTOC(frag, this.toc)
        replaceSVGImageWithIMG(frag)
        for (const img of Array.from(frag.querySelectorAll("img"))) {
            //TODO: Allow a default image to be used when no src.
            const src = this.rootPath.alter(img.src || img.dataset.src || "unknown")
            img.dataset.src = src;
            for (const _id in this.manifest) {
                if (src == this.manifest[_id].href) {
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
            } catch (e) {
                console.log("Transform failed: ", id, e);
            }
        }

        this.cache.setText(id, str)
        return str
    }

    searchManifestOrPanic(id: string) {
        const l = this.manifest[id] || null
        if (l == null)
            throw new UnknownItemError(`Unkown manifest item: ${id}`);

        return l;
    }
    /**
     * @param {string} id :Manifest id value for the content
     * @returns {Promise<string>} : Raw Chapter text for mime type application/xhtml+xml
     **/
    private async getContentRaw(id: string): Promise<string> {
        const elem = this.searchManifestOrPanic(id)
        const imageMIMEs = /^(application\/xhtml\+xml|image\/svg\+xml)$/i;

        MIMEError.unless({ id, actual: elem["media-type"], expected: imageMIMEs })

        return (await this.readFile(elem.href)).data.toString();
    }

    /**
     *  Return only images with mime type image
     * @param {string} id of the image file in the manifest
     * @returns {Promise<string>} Returns a promise of the image as a blob if it has a proper mime type.
     */
    async getImage(id: string): Promise<string> {
        if (this.cache.image[id])
            return this.cache.image[id];

        const item = this.searchManifestOrPanic(id)
        MIMEError.unless({ id, actual: item["media-type"].trim(), expected: /^image\//i })

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

export default Epub;