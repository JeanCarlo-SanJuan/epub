import EventEmitter from "events"
import * as zip from "@zip.js/zip.js"
import convert from "xml-js";
import toArray from "./toArray.js"

class Epub extends EventEmitter {
    constructor(file) {
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
        this.flow = [];
        this.flowIndex = 0;
        this.toc = [];

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
        this.emit("error", new Error(msg));
    }

    /**
     *  Opens the epub file with Zip unpacker, retrieves file listing
     *  and runs mime type check
     **/
    async open() {
        this.reader = new zip.ZipReader(new zip.BlobReader(this.file.archive))

        // get all entries from the zip
        this.entries = await this.reader.getEntries();

        // close the ZipReader
        await this.reader.close();

        if (!this.entries) {
            this.error("No files in archive")
            return;
        }

        this.checkMimeType();
    }
    
    /**
     * 
     * @param {String} name 
     * @returns {zip.Entry}
     */
    getFileInArchive(name) {
        for (const entry of this.entries) {

            //Allow partial matches
            if (name.toLowerCase().includes(entry.filename.toLowerCase())) {
                return entry;
            }
        }

        this.error(name + " not found in archive!")
    }

    /**
     * 
     * @param {String} w 
     * @returns 
     */
     determineWriter(w) {
        switch(w) {
            case "text":
                return new zip.TextWriter()
            break;
            case "blob":
                return new zip.BlobWriter() 
            break;
        }
    }

    /**
     * Reads a file from the archive
     * @param {String} name 
     * @param {String} writer 
     * @returns {Promise<{Object, Object}>
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
        const {"file": mimeFile, "data":txt} = await this.getFileContents("mimetype")
        this.file.mime = mimeFile;
        if (txt != "application/epub+zip") {
            this.error("Unsupported mime type");
            return;
        }

        this.getRootFiles();
    }

    /**
     *  Looks for a "meta-inf/container.xml" file and searches for a
     *  rootfile element with mime type "application/oebps-package+xml".
     *  On success, calls the rootfile parser
     **/
    async getRootFiles() {
        this.file.container = await this.getFileContents("meta-inf/container.xml")
        
        const {data} = this.file.container
        const {container} = this.xml2js(data.toString("utf-8").toLowerCase().trim())
        if (!container.rootfiles || !container.rootfiles.rootfile) {
            this.error("No rootfiles found")
            return;
        }

        const rootFile = container.rootfiles.rootfile

        const {"full-path": fullPath, "media-type": mediaType} = rootFile._attributes;

        if (mediaType != "application/oebps-package+xml") {
            this.error("Invalid mime type for " + fullPath)
        }

        this.file.rootName = fullPath
        this.rootPath = {
            array :fullPath.split("/"),
            str : "",

            /**
             * 
             * @param {String} filepath 
             * @returns 
             */
            alter(filepath) {
                filepath = filepath
                    .replace("../", "")
                    .replace(window.location.href, "")

                if (filepath.startsWith(this.str)) {
                    return filepath
                }

                return this.str + filepath
            }
        }
        this.rootPath.array.pop()
        this.rootPath.str = this.rootPath.array.join("/") + "/"

        this.handleRootFile();
    }

    /**
     * Converts text to Object
     * @param {String} data 
     * @returns convert.elementCompact
     */
    xml2js(data) {
        return convert.xml2js(data, {compact: true, spaces: 4})
    }
    async handleRootFile() {
        const {data} = await this.getFileContents(this.file.rootName)
        const xml = this.xml2js(data)
        this.rootXML = xml
        this.emit("parsed-root")
    }

    /**
     * 
     * @param {Object} package
     * @param {Object} package.manifest
     * @param {Object} package.metadata
     * @param {Object} package.spine
     * @param {Object} package._attributes
     */
    async parseRootFile({package:pkg}) {
        this.version = pkg._attributes.version || '2.0';
        this.parseMetadata(pkg.metadata)
        this.parseManifest(pkg.manifest)
        this.parseSpine(pkg.spine)
        this.parseTOC().then(() => {
            this.emit("loaded")
        })
    }

    /**
     * @param {Array} manifest 
     */
    parseManifest(manifest) {
        for(const item of manifest.item) {
            const element = item._attributes
            element.href = this.rootPath.alter(element.href)

            this.manifest[element.id] = element
        }
        this.emit("parsed-manifest")
    }

    /**
     * 
     * @param {Object} spine 
     */
    parseSpine(spine) {
        this.spine = Object.assign(
            this.spine, 
            spine._attributes
        )

        if (spine.itemref) {
            spine.itemref = toArray(spine.itemref)
            for (const {_attributes} of spine.itemref) {
                const element = Object.assign({}, this.manifest[_attributes.idref] )
                this.spine.contents.push(element)
            }
        }
        this.flow = this.spine.contents;
        this.emit("parsed-spine")
    }

    /**
     * @param {String} txt 
     * @returns String: the UUID
     * 
     * Helper function for parsing metadata
     */
    extractUUID(txt) {

        if (typeof txt == "string") {
            txt = txt.toLowerCase()
            let parts = txt.split(":")
            if (parts.includes("uuid")) {
                return parts[parts.length - 1];
            }
        }
    
        return ""
    }
    /**
     * Emits a "parsed-metadata" event
     * @param {Object} metadata 
     */
    parseMetadata(metadata) {
        for(const [k,v] of Object.entries(metadata)) {
            const keyparts = k.split(":");
            const key = (keyparts[keyparts.length-1] || "").toLowerCase().trim();
            const text = v._text
            switch (key) {
                case "publisher":
                    this.metadata.publisher = text
                    break;
                case "language":
                    this.metadata.language = text
                    break;
                case "title":
                    this.metadata.title = text
                    break;
                case "subject":
                    this.metadata.subject = text
                    break;
                case "description":
                    this.metadata.description = text
                    break;
                case "creator":
                    if (Array.isArray(v)) {
                        this.metadata.creator = v.map(item => {
                            return item._text
                        }).join(" | ")
                    } else {
                        this.metadata.creator = text
                    }
                    break;
                case "date":
                    this.metadata.date = text
                    break;
                case "identifier":
                    if(Array.isArray(v)) {
                        this.metadata.UUID = this.extractUUID(v[0]._text)
                    } else if (v["opf:scheme"] == "ISBN") {
                        this.metadata.ISBN = text;
                    } else {
                        this.metadata.UUID = this.extractUUID(text)
                    }
                    
                    break;
            }
        }

        this.emit("parsed-metadata")
    }

    /**
     * There are 2 ways to determine the TOC:
     * 1. With an ncx file that is required in EPUB2
     * 2. With toc.xhtml
     * Since NCX is not required in EPUB3 use option 2.
     * Read : https://docs.fileformat.com/ebook/ncx/
     * 
     * Emits a "parsed-toc" event
     */
    async parseTOC() {
        const hasNCX = Boolean(this.spine.toc)
        let toc, tocElem;

        console.log("has NCX:", hasNCX);

        tocElem = (hasNCX) ? 
            this.manifest[this.spine.toc]
            :this.manifest["toc"];

        const IDs = {};
        for (const [k, v] of Object.entries(this.manifest)) {
            IDs[v.href] = k
        }
        const {data} = await this.getFileContents(tocElem.href)
        if(!data) {
            this.emit("No TOC!!!")
        }
        const xml = this.xml2js(data)

        if (hasNCX) {
            const path = tocElem.href.split("/")
            path.pop();
            toc = this.walkNavMap({
                "branch": xml.ncx.navMap.navPoint,
                "path" : path, 
                "IDs": IDs
            })
        } else {
            toc = this.walkTOC(xml.html.body)
        }

        this.toc = this.matchTOCWithManifest(toc);
        this.emit("parsed-toc")
    }

    matchTOCWithManifest(toc) {
        for (const elem of toc) {

            if (elem.href.includes(elem.id)) {
                continue                                                                            
            }

            let href;
            //Remove white space and page jumps
            if (elem.href.includes("#")) {
                [href] = elem.href.trim().split("#", 1)
            }

            for (const key in this.manifest) {
                if (href == this.manifest[key].href) {
                    elem.id = key;
                    break;
                }
            }
        }

        return toc
    }
    /**
     * Builds the TOC using the body of the xml from the TOC file. 
     * @param {Object} body
     */
    walkTOC(body) {
        let order = 0;
        const IDs = {}
        const toc = []
        for (const p of body.p) {
            let _id = p._attributes.id
            _id = _id.replace(/toc(-|:)/i, "").trim()
            let title = p.a._text;
            if (!this.manifest[_id]) {
                continue
            }

            const element = this.manifest[_id];
            element.title = title;
            element.order = order++;

            toc.push(element)
        }

        console.log("OPF", toc);
        return toc;
    }

    /**
     *  Walks the NavMap object through all levels and finds elements
     *  for TOC with NCX
     * @param {Object} obj
     * @param {Array | Object} obj.branch
     * @param {Array} obj.path
     * @param {Number} obj.level
     * @returns {Array}
     */
    walkNavMap({branch, path, IDs, level = 0}) {
        // don't go too deep
        if (level > 7) {
            return [];
        }

        const output = [];
        for (const part of toArray(branch)) {
            
            if (!part)
                continue

            let title = "";
                
            if (part.navLabel) {
                title = (part.navLabel.text._text || part.navLabel).trim()
            }

            let order = Number(part._attributes.playOrder || 0)
            if (isNaN(order)) {
                order = 0;
            }

            let href = part.content._attributes.src
            if (typeof href == "string") {
                href = href.trim();
            }

            let element = {
                level: level,
                order: order,
                title: title
            };

            if (href) {
                element.href = path.concat([href]).join("/");

                if (IDs[element.href]) {
                    // link existing object
                    element = this.manifest[IDs[element.href]];
                    element.title = title;
                    element.order = order;
                    element.level = level;

                } else {
                    // use new one
                    element.id = (part._attributes.id || "").trim();
                }

                output.push(element);
            }

            if (part.navPoint) {
                output.push(...this.walkNavMap(part.navPoint, path, IDs, level + 1));
            }
        }

        return output;
    }

    /**
    * Gets the text from a file based on id. 
    * Replaces image and link URL's
    * and removes <head> etc. elements. 
    * @param {String} id :Manifest id of the file
    * @returns {Promise<String>} : Chapter text for mime type application/xhtml+xml
    */
     async getContent(id) {
        const isCached = Boolean(Object.keys(this.cache.text).includes(id))
        if (isCached) {
            return this.cache.text[id]
        }

        let str = await this.getContentRaw(id);
    
        // remove linebreaks (no multi line matches in JS regex!)
        str = str.replace(/\r?\n/g, "\u0000");

         // keep only <body> contents
        str.replace(/<body[^>]*?>(.*)<\/body[^>]*?>/i, (o, d) => {
            str = d.trim();
        });

        const frag = document.createElement("div");
        frag.innerHTML =  str;
        const removeChildsWith = () => {
            for(const selector of arguments) {
                for (const child of frag.querySelectorAll(selector)) {
                    children.parentNode.removeChild(child)
                }
            }
        }

        removeChildsWith("script", "style")
        
        const onEvent = /^on.+/i;

        for (const elem of frag.querySelectorAll("*")) {
            for (const {name} of elem.attributes) {
                if (onEvent.test(name)) {
                    elem.removeAttribute(name)
                }
            }
        }

        //Replace SVG <image> with <img>
        for (const svg of frag.querySelectorAll("svg")) {
            const image = svg.querySelector("image")
            const img = new Image();
            img.dataset.src = image.getAttribute("xlink:href")
            svg.parentNode.replaceChild(img, svg)
        }

        for (const img of frag.querySelectorAll("img")) {
            const src = this.rootPath.alter(img.src || img.dataset.src)
            img.src = ""
            for(const {id, href} of Object.values(this.manifest)) {
                if (href == src) {
                    img.src = await this.getImage(id)
                }
            }
        }

        str = frag.innerHTML
        this.cache.setText(id, str)
        return str
     }

     /**
     * @param {String} id :Manifest id value for the content
     * @returns {Promise<String>} : Raw Chapter text for mime type application/xhtml+xml
     **/
    async getContentRaw(id) {
        if (!this.manifest[id]) {
            return ""
        }
        const allowedMIMETypes = /^(application\/xhtml\+xml|image\/svg\+xml)$/i;
        const elem = this.manifest[id]

        let match = allowedMIMETypes.test(elem["media-type"])
        if (!match) {
            this.error("Invalid mime type for chapter")
        }

        return (await this.getFileContents(elem.href)).data;
    }

    /**
     *  Return only images with mime type image
     * @param {String} id of the image file in the manifest
     * @returns {Promise<Blob>} Returns a promise of the image as a blob if it has a proper mime type.
     */
    async getImage(id) {
        if (!this.manifest[id]) {
            return new Blob()
        }

        if(this.cache.image[id]) {
            return this.cache.image[id]
        }

        const imageType = /^image\//i;
        const m = this.manifest[id]["media-type"]
        let match = imageType.test(m.trim())

        if (!match) {
            console.log("Warning: Invalid mime type for image!");
            return "";
        }

        const {"data": b} = await this.getFileContents(this.manifest[id].href, "blob")

        const r = new FileReader();
        return new Promise((resolve, reject) => {
            r.onload = (e) => {
                this.cache.setImage(id, e.target.result)
                resolve(e.target.result)
            }

            r.onerror = () => reject(r.error);

            r.readAsDataURL(b)
        })
    }

    /**
     *  Parses the tree to see if there's an ecnryption file, signifying the presence of DRM
     *  see: https://stackoverflow.com/questions/14442968/how-to-check-if-an-epub-file-is-drm-protected
     **/
    hasDRM () {
        const drmFile = 'META-INF/encryption.xml';
        return Boolean(this.getFileInArchive(drmFile));
    }
}

export default Epub