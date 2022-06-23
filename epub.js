import EventEmitter from "events"
import * as zip from "@zip.js/zip.js"
import convert from "xml-js";
import toArray from "./toArray.js"
import removeChildsWith from "./removeChildsWithSelectors.js";
import RootPath from "./RootPath.js";

export const ev = {
    root : "parsed-root",
    manifest: "parsed-manifest",
    spine: "parsed-spine",
    flow: "parsed-flow",
    toc: "parsed-toc",
    metadata: "parsed-metadata",
    err: "error",
    loaded: "loaded"
}
export class Epub extends EventEmitter {
    /**
     * @param {File} file 
     * @param {Function} chapterTransformer - Must accept one argument that accepts an HTMLDIVElement that will act like a DocumentFragment.
     */
    constructor(file, chapterTransformer = undefined) {
        super();

        this.file = {
            archive : file,
            container : false,
            mime : false,
            root : false
        }

        this.metadata = {};
        this.manifest = {};
        this.spine = {toc: false, contents: []};
        this.flow = new Map();
        this.toc = new Map();
        this.chapterTransformer = chapterTransformer
        this.cache = {
            text : {},
            setText(id, t) {
                this.text[id]= t;
            },
            image : {},
            setImage(id, blob) {
                this.image[id]= blob;
            }
        }
    }

    error(msg) {
        this.emit(ev.err, new Error(msg));
    }

    errorMIME(name) {
        this.error("Invalid mimetype for: " + name)
    }
    /**
     *  Extracts the epub files from a zip archive, retrieves file listing
     *  and runs mime type check. May optionally set event listeners with an object. Note that "this" will be bounded to the Epub instance so it is suggested to use the Function keyword instead of arrow funcs. 
     * @param {object} events
     **/
    async open(events = {}) {
        this.reader = new zip.ZipReader(new zip.BlobReader(this.file.archive))

        for (const [name, cb] of Object.entries(events)) {
            this.on(name, cb.bind(this))
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
     * 
     * @param {string} name 
     * @returns {zip.Entry} a file from the zip
     */
    getFileInArchive(name) {
        for (const entry of this.entries) {
            if (entry.directory)
                continue;

            //Remove leading / for paths
            if (name[0] == "/")
                name = name.slice(1);

            //Allow partial matches
            const eFN = entry.filename.toLowerCase();
            const fn = name.toLowerCase();
            if (eFN.includes(fn) || fn.includes(eFN))
                return entry;
        }

        this.error(name + " not found in archive!")
    }

    /**
     * 
     * @param {string} w 
     * @returns the appropriate zip writer
     */
     determineWriter(w) {
        switch(w) {
            case "text":
                return new zip.TextWriter()
            case "blob":
                return new zip.BlobWriter() 
        }
    }

    /**
     * Reads a file from the archive
     * @param {string} name 
     * @param {string} writer 
     * @returns {Promise<{object, object}>
     */
    async getFileContents(name, writer = "text") {
        const f = this.getFileInArchive(name)
        const w = this.determineWriter(writer)
        return {file:f, data: await f.getData(w)}
    }
    /**
     *  Checks if there's a file called "mimetype" and that it's contents
     *  are "application/epub+zip". On success, runs root file check.
     **/
    async checkMimeType() {
        const target = "application/epub+zip";
        const {file, data} = await this.getFileContents("mimetype")
        this.file.mime = file;
        if (data != target)
            this.errorMIME(target);

        this.getRootFiles();
    }

    /**
     *  Looks for a "meta-inf/container.xml" file and searches for a
     *  rootfile element with mime type "application/oebps-package+xml".
     *  On success, calls the rootfile parser
     **/
    async getRootFiles() {
        this.file.container = await this.getFileContents("meta-inf/container.xml")
        
        const {container} = this.xml2js(this.file.container.data
            .toString("utf-8")
            .toLowerCase()
            .trim()
        )

        if (!container.rootfiles || !container.rootfiles.rootfile)
            this.error("No rootfiles found");

        const {"full-path": fullPath, "media-type": mediaType} = 
            container.rootfiles.rootfile._attributes;

        if (mediaType != "application/oebps-package+xml") {
            this.errorMIME(fullPath)
        }

        this.file.rootName = fullPath
        this.rootPath = new RootPath(fullPath);

        this.handleRootFile();
    }

    /**
     * Converts text to Object
     * @param {string} data 
     * @returns convert.elementCompact
     */
    xml2js(data) {
        return convert.xml2js(data, {compact: true, spaces: 4})
    }
    async handleRootFile() {
        const {data} = await this.getFileContents(this.file.rootName)
        this.rootXML = this.xml2js(data)
        this.emit(ev.root)
    }

    /**
     * 
     * @param {object} package
     * @param {object} package.manifest
     * @param {object} package.metadata
     * @param {object} package.spine
     * @param {object} package._attributes
     */
    async parseRootFile({package:pkg}) {
        this.version = pkg._attributes.version || '2.0';

        this.metadata = this.parseMetadata(pkg.metadata)
        this.emit(ev.metadata)

        this.manifest = this.parseManifest(pkg.manifest.item)
        this.emit(ev.manifest)

        this.spine = this.parseSpine(pkg.spine, this.manifest)
        this.emit(ev.spine)

        this.flow = this.parseFlow(this.spine.contents);
        this.emit(ev.flow)

        this.toc = await this.parseTOC(this.manifest, this.spine.toc)
        this.emit(ev.toc)
        
        this.emit(ev.loaded)
    }

    /**
     * @param {Array<object>} items of the manifest.
     */
    parseManifest(items) {
        const manifest = {}
        for(const item of items) {
            const elem = item._attributes
            elem.href = this.rootPath.alter(elem.href)
            elem.id = elem.id.replace('.','_')
            manifest[elem.id] = elem
        }

        return manifest;
    }

    /**
     * 
     * @param {object} _spine 
     * @param {object} manifest
     */
    parseSpine(_spine, manifest) {
        const spine = Object.assign(
            this.spine,  //Required Side Effect
            _spine._attributes
        )
        if (_spine.itemref) {
            _spine.itemref = toArray(_spine.itemref)

            for (const {_attributes} of _spine.itemref) {
                const element = Object.assign({}, manifest[_attributes.idref.replace('.', '_')])
                element.id = element.id.replace('.', '_')
                spine.contents.push(element)
            }
        }

        return spine; 
    }

    /**
     * 
     * @param {Array<object>} contents 
     * @returns {Map<string, object>} the book's flow
     */
    parseFlow(contents) {
        const flow = new Map()
        contents.map(item =>
            flow.set(item.id, item)
        )

        return flow;
    }
    /**
     * @param {string} txt 
     * @returns {string} the UUID
     * 
     * Helper function for parsing metadata
     */
    extractUUID(txt) {

        if (typeof txt == "string") {
            txt = txt.toLowerCase()
            let parts = txt.split(":")
            if (parts.includes("uuid"))
                return parts[parts.length - 1];
        }
    
        return ""
    }
    /**
     * Emits a "parsed-metadata" event
     * @param {object} _metadata 
     */
    parseMetadata(_metadata) {
        const metadata = {};
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
     * There are 2 ways to determine the TOC:
     * 1. With an ncx file that is required in EPUB2
     * 2. With toc.xhtml
     * Since NCX is not required in EPUB3 use option 2.
     * Read : https://docs.fileformat.com/ebook/ncx/
     * 
     * Emits a "parsed-toc" event
     * @param {object} manifest
     * @param {object} _toc
     */
    async parseTOC(manifest, _toc) {
        const hasNCX = Boolean(_toc)
        let toc, tocElem;

        console.log("has NCX:", hasNCX);

        tocElem = manifest[
            (hasNCX) ? _toc:"toc"
        ]
        
        const IDs = {};
        
        for (const [k, v] of Object.entries(manifest)) {
            IDs[v.href] = k
        }
        const {data} = await this.getFileContents(tocElem.href)
        if(!data)
            this.error("No TOC!!!");

        const xml = this.xml2js(data)

        if (hasNCX) {
            const path = tocElem.href.split("/")
            path.pop();
            toc = this.walkNavMap(
                {
                "branch": xml.ncx.navMap.navPoint,
                "path" : path, 
                "IDs": IDs
                }
                , manifest
            )
        } else {
            toc = this.walkTOC(xml.html.body, manifest);
            console.log("OPF", toc);
        }

        return toc = this.matchTOCWithManifest(toc, manifest);
    }

    /**
     * 
     * @param {object} toc 
     * @param {object} manifest 
     * @returns {object} the altered toc
     */
    matchTOCWithManifest(toc, manifest) {
        for (const [id, elem] of toc) {

            if (elem.href.includes(id)) {
                continue
            }

            let href;
            //Remove white space and page jumps
            if (elem.href.includes("#"))
                [href] = elem.href.trim().split("#", 1)

            for (const key in manifest) {
                if (href == manifest[key].href) {
                    elem.id = key;
                    break;
                }
            }
        }

        return toc
    }
    /**
     * Builds the TOC using the body of the xml from the TOC file. 
     * @param {object} body
     * @param {object} manifest
     */
    walkTOC(body, manifest) {
        let order = 0;
        const toc = new Map()
        for (const p of body.p) {
            let _id = p._attributes.id
            _id = _id
                .replace('.','_')
                .replace(/toc(-|:)/i, "")
                .trim()
            let title = p.a._text;

            const element = manifest[_id] || null;

            if (element == null)
                continue

            element.title = title;
            element.order = order++;
            element.id = element.id.replace('.', '_')
            toc.set(_id, element)
        }

        return toc;
    }

    /**
     *  Walks the NavMap object through all levels and finds elements
     *  for TOC with NCX
     * @param {object} obj
     * @param {Array | Object} obj.branch
     * @param {Array} obj.path
     * @param {Number} obj.level
     * @returns {Map}
     */
    walkNavMap({branch, path, IDs, level = 0}, manifest) {
        // don't go too deep
        if (level > 7)
            return [];

        const output = new Map();
        for (const part of toArray(branch)) {
            
            if (!part)
                continue

            let title = "";
                
            if (part.navLabel)
                title = (part.navLabel.text._text || part.navLabel).trim()

            let order = Number(part._attributes.playOrder || 0)
            if (isNaN(order))
                order = 0;

            let href = part.content._attributes.src
            if (typeof href == "string")
                href = href.trim();

            let element = {
                level: level,
                order: order,
                title: title
            };

            if (!href)
                continue

            element.href = path.concat([href]).join("/");

            const id = IDs[element.href] || null

            if (id == null) // use new one
                
                element.id = (part._attributes.id || "").trim();
            else { // link existing object
                element = manifest[id];
                element.title = title;
                element.order = order;
                element.level = level;
                element.id = element.id.replace('.','_')
                element.navPoint = (part.navPoint) ?
                    this.walkNavMap(
                        {
                        "branch": part.navPoint,
                        "path" : path, 
                        "IDs": IDs,
                        "level": level + 1
                        }
                        , manifest
                    )
                    : false;
            }

            output.set(element.id, element);
        }

        return output;
    }

    /**
    * Gets the text from a file based on id. 
    * Replaces image and link URL's
    * and removes <head> etc. elements. 
    * If the chapterTransformer function is set, will pass it to the root element before returning.
    * @param {string} id :Manifest id of the file
    * @returns {Promise<string>} : Chapter text for mime type application/xhtml+xml
    */
     async getContent(id) {
        if (Object.keys(this.cache.text).includes(id))
            return this.cache.text[id];

        let str = await this.getContentRaw(id);
        
        // remove linebreaks (no multi line matches in JS regex!)
        str = str.replace(/\r?\n/g, "\u0000");

         // keep only <body> contents
        str.replace(/<body[^>]*?>(.*)<\/body[^>]*?>/i, (o, d) => {
            str = d.trim();
        });
        const fragment = document.createElement("template");
        fragment.innerHTML =  str;
        const frag = fragment.content.firstElementChild

        removeChildsWith(frag, "script", "style");
        
        const onEvent = /^on.+/i;

        for (const elem of frag.querySelectorAll("*")) {
            for (const {name} of elem.attributes) {
                if (onEvent.test(name))
                    elem.removeAttribute(name);
            }
        }

        //Replaces chapter links with the ids that can be used to refer to them in the TOC
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
            img.dataset.src = image.getAttribute("xlink:href")
            svg.parentNode.replaceChild(img, svg)
        }

        for (const img of frag.querySelectorAll("img")) {
            const src = this.rootPath.alter(img.src || img.dataset.src)
            img.dataset.src = src;
            for(const _id in this.manifest) {
                if(src == this.manifest[_id].href)
                    img.src = await this.getImage(_id);
            }
        }

        if (typeof this.chapterTransformer == "function")
            try {
                str = this.chapterTransformer(frag).innerHTML;
            } catch(e) {
                console.log("Transform failed: ", id);
            }

        this.cache.setText(id, str)
        return str
     }

     /**
     * @param {string} id :Manifest id value for the content
     * @returns {Promise<string>} : Raw Chapter text for mime type application/xhtml+xml
     **/
    async getContentRaw(id) {
        const elem = this.manifest[id] || null
        
        if (elem == null)
            return "";
    
        const allowedMIMETypes = /^(application\/xhtml\+xml|image\/svg\+xml)$/i;

        const match = allowedMIMETypes.test(elem["media-type"])
        if (!match)
            this.errorMIME("chapter - " + id);

        return (await this.getFileContents(elem.href)).data;
    }

    /**
     *  Return only images with mime type image
     * @param {string} id of the image file in the manifest
     * @returns {Promise<Blob>} Returns a promise of the image as a blob if it has a proper mime type.
     */
    async getImage(id) {
        if(this.cache.image[id])
        return this.cache.image[id];

        const item = this.manifest[id] || null;
        if (item == null)
            return "";

        const imageType = /^image\//i;

        const match = imageType.test(item["media-type"].trim())
        if (!match) {
            console.log("Warning: Invalid mime type for image: " + id);
            return "";
        }

        const {data} = await this.getFileContents(item.href, "blob")

        const r = new FileReader();
        return new Promise((resolve, reject) => {
            r.onload = (e) => {
                this.cache.setImage(id, e.target.result)
                resolve(e.target.result)
            }

            r.onerror = () => reject(r.error);

            r.readAsDataURL(data)
        })
    }

    /**
     *  Parses the tree to see if there's an encryption file, signifying the presence of DRM
     *  see: https://stackoverflow.com/questions/14442968/how-to-check-if-an-epub-file-is-drm-protected
     **/
    hasDRM () {
        const drmFile = 'META-INF/encryption.xml';
        return Object.keys(this.entries).includes(drmFile);
    }
}

export default Epub;