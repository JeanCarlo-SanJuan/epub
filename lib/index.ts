import { EnhancedMap } from "@jcsj/arraymap";
import { BlobReader, BlobWriter, Entry, TextWriter, ZipReader } from "@zip.js/zip.js";
import { MIMEError } from "./error/MIMEError";
import { TableOfContents } from "./toc/TableOfContents";
import * as trait from "./traits";
import EV from "./EV";
import { ElementCompact, Options, xml2js } from "@jcsj/xml-js";
import { parseFlow } from "./parseFlow";
import { parseManifest } from "./parseManifest";
import { parseMetadata } from "./parseMetadata";
import { parseSpine } from "./parseSpine";
import { parseTOC } from "./toc/parseTOC";
import { UnknownItemError } from "./error/UnkownItemError";
import { matchAnchorsWithFlow } from "./matchAnchorsWithTOC";
import { removeInlineEventsInFragment } from "./removeInlineEvents";
import { xmlToFragment } from "./xmlToFragment";
import BookCache from "./BookCache";
import { matchMediaSources } from "./matchSource";
import { Item } from "./traits";

export interface EpubParts {
    metadata: Partial<trait.Metadata>;
    manifest: trait.Manifest;
    spine: trait.Spine;
    flow: trait.Flow;
    toc: TableOfContents;
}

export class Reader extends ZipReader<Blob> {
    entries: Entry[] = []
    static MIME = "application/epub+zip";
    static TARGET = "mimetype"
    static CONTAINER_ID = "meta-inf/container.xml"
    static OEBPS_ID = "application/oebps-package+xml"
    constructor(value: Blob) {
        super(new BlobReader(value));
    }
    container?: trait.LoadedEntry = undefined;
    /**
     * Extracts the epub files from a zip archive, retrieves file listing, and check mime type.
     */
    async init() {
        this.entries = await this.getEntries()
        // close the ZipReader
        await this.close();

        if (this.entries.length) {
            await this.checkMimeType();
        }
        else {
            throw new Error("Empty archive!");
        }

        this.container = await this.read(Reader.CONTAINER_ID);
    }
    /**
     *  Finds a file named "mimetype" and check if the content
     *  is exactly `Reader.MIME`.
     **/
    async checkMimeType() {
        const { data } = await this.read(Reader.TARGET)
        MIMEError.unless({ id: Reader.TARGET, actual: data as string, expected: Reader.MIME })
    }

    async read(name: string, type?: string): Promise<trait.LoadedEntry> {
        const file = this.partialSearch(name);

        return {
            file,
            data: await file.getData(
                this.determineWriter(type)
                , {})
        }
    }

    prepareGet(name: string) {
        return (predicate: (n: Entry) => boolean) => {
            const entry = this.entries.find(predicate)

            if (entry)
                return entry;

            throw new Error(`Could not find entry with name ${name}, "extracted filename was ${name}`);
        }
    }

    get(name: string) {
        return this.prepareGet(name)(n => n.filename === name)
    }

    partialSearch(name: string) {
        //Remove leading '/' for paths
        const fn = decodeURI(name[0] == '/' ? name.slice(1) : name).toLowerCase();
        return this.prepareGet(fn)(n => {
            if (n.directory) {
                return false
            }
            const nf = n.filename.toLowerCase()
            return nf.includes(fn) || fn.includes(nf)
        })
    }

    /**
     * @returns the appropriate zip writer
     */
    determineWriter(t?: string) {
        if (t?.includes("image/"))
            return new BlobWriter(t)
        else
            return new TextWriter("utf-8")
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EPUBProgressEvents extends Partial<Record<EV, (ev:EV)=>void>> { }

export class Parser extends Reader {
    static OPTIONS: Options.XML2JSON = Object.freeze({
        compact: true,
        spaces: 4
    })

    rootPath!: string;
    rootXML: ElementCompact = {};
    VERSION?: string;
    progressEvents: EPUBProgressEvents = {};

    /**
     * Converts xml data to Object
     */
    xml2js(data: string): ElementCompact {
        return xml2js(data, Parser.OPTIONS)
    }

    async zip2JS(name: string) {
        const { data } = await this.read(name);
        return this.xml2js(data as string);
    }

    async init() {
        await super.init()
        const container = await parseContainer(this)
        this.rootPath = Parser.getRootPath(container)
    }

    static getRootPath(container:ElementCompact) {
        if (!container.rootfiles || !container.rootfiles.rootfile)
            throw TypeError("No rootfiles found");

        const d: { "full-path": string, "media-type": string } =
            container.rootfiles.rootfile._attributes;

        MIMEError.unless({ id: Reader.CONTAINER_ID, actual: d["media-type"], expected: Reader.OEBPS_ID })

        return d["full-path"];
    }
}

/**
 * @desc `Epub` class that does not modify the file data in get calls.
 */
export class EpubBase extends Parser implements EpubParts {
    constructor(value: Blob) {
        super(value);
    }
    metadata: Partial<trait.Metadata> = {};
    manifest: trait.Manifest = {};
    spine: trait.Spine = {
        toc: "",
        contents: []
    };
    flow: trait.Flow = new trait.Flow();
    toc: TableOfContents = new EnhancedMap();

    /**
     * @override
     */
    async init() {
        await super.init()
        await this.handleRootFile()
    }
    /**
     *  Accepts event listeners with an object whose keys denotes the 'event name' while the value must be a function. "this" is bounded to the 'Epub' instance. 
     **/
    async open(p: EPUBProgressEvents = {}) {
        this.progressEvents = p
        await this.init()
    }
    async handleRootFile() {
        const entry = await this.read(this.rootPath)
        this.rootXML = this.xml2js(entry.data.toString())
        this.emit(EV.root)
    }

    emit(ev: EV) {
        this.progressEvents[ev]?.(ev)
    }

    async parseRootFile({ package: pkg }: { package: trait.RootFile }) {
        this.VERSION = pkg._attributes.version || "2.0";
        this.metadata = parseMetadata(pkg.metadata)
        this.emit(EV.metadata)

        this.manifest = parseManifest(pkg.manifest.item)
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
     * TODO: Use TS Array.filter definition
     */
    filter(predicate: (value: trait.Item, index: number, array: trait.Item[]) => boolean) {
        return Object.values(this.manifest).filter(predicate)
    }
    matchAll(re:RegExp|string) {
        let cb: (item:trait.Item) => boolean;
        if (typeof re === "string") {
            cb = item => item.id.includes(re)
        } else {
            cb = item => re.test(item.id)
        }
        return this.filter(cb)
    }

    searchManifestOrPanic(id: string) {
        const l = this.manifest[id]
        if (l === undefined)
            throw new UnknownItemError(`Unkown manifest item: ${id}`);

        return l;
    }

    /**
     * @param {string} id :Manifest id value for the content
     * @returns {Promise<string>} : Raw Chapter text for mime type application/xhtml+xml
     **/
    async getContent(id: string): Promise<string> {
        const elem = this.searchManifestOrPanic(id)
        const imageMIMEs = /^(application\/xhtml\+xml|image\/svg\+xml|text\/css)$/i;

        MIMEError.unless({ id, actual: elem["media-type"], expected: imageMIMEs })

        return (await this.read(elem.href, elem["media-type"])).data.toString();
    }

    /**
     *  Return only images with mime type image
     * @param {string} id of the image file in {@link Epub.manifest}
     * @returns {Promise<string>} Returns a promise with the data's ObjectURL
     */
    async getImage(id: string): Promise<string> {
        const item = this.searchManifestOrPanic(id)
        MIMEError.unless({ id, actual: item["media-type"].trim(), expected: /^image\//i })

        const entry = (await this.read(item.href, item["media-type"]))
        return URL.createObjectURL(entry.data as Blob);
    }
}

export type UnaryFX<T, RT> = (v: T) => RT;
export type ChapterTransformer = UnaryFX<DocumentFragment, HTMLElement>;

/**
 * @desc `Includes sanitation and aligns the parsed content to the epub parts, ready to use in the web.
 * 
 * For caching subsequent get calls use {@link CachedEpub}
 */
export class Epub extends EpubBase {
    chapterTransformer?: ChapterTransformer;
    constructor(value: Blob, chapterTransformer: ChapterTransformer) {
        super(value)
        this.chapterTransformer = chapterTransformer;
    }
    /**
     * @override
     * @implNote removes inline events and matches anchors, links, and srcs with the manifest data. May also provide a chapter transformer for even more customization.
     */
    async getContent(id: string): Promise<string> {
        const str = await this.getContentRaw(id);
        const frag = xmlToFragment(str, id);
        removeInlineEventsInFragment(frag);
        matchAnchorsWithFlow(frag, this.flow)
        await matchMediaSources(this, frag)
        if (this.chapterTransformer instanceof Function) {
            try {
                return this.chapterTransformer(frag).innerHTML;
            } catch (e) {
                console.log("Transform failed: ", id, e);
            }
        }

        return str
    }

    async getContentRaw(id: string) {
        return super.getContent(id)
    }
}

export async function parseContainer(p: Parser) {
    const maybeContainer = await p.read(Reader.CONTAINER_ID);

    return p.xml2js(maybeContainer.data
        .toString()
        .toLowerCase()
        .trim()
    ).container as ElementCompact;
}

/**
 * @desc Memoizes get calls
 */
export class CachedEpubBase extends EpubBase {
    cache = new BookCache()
    constructor(value: Blob) {
        super(value)
    }

    async getContent(id: string) {
        return cacheOrMiss(
            this.cache.text,
            super.getContent.bind(this),
            id
        )
    }

    async getImage(id: string) {
        return cacheOrMiss(
            this.cache.image,
            super.getImage.bind(this),
            id
        )
    }
}

async function cacheOrMiss<T>(cache: Record<string, T>, cb: (id: string) => Promise<T>, id: string) {
    if (cache[id]) {
        return cache[id]
    }
    const result = await cb(id)
    cache[id] = result
    return result;
}

/**
 * {@link CachedEpubBase}
 * @desc This class is equivalent with V1.
 */
export class CachedEpub extends Epub {
    cache = new BookCache()
    constructor(value: Blob, chapterTransformer: ChapterTransformer) {
        super(value, chapterTransformer)
    }

    async getContent(id: string) {
        return cacheOrMiss(
            this.cache.text,
            super.getContent.bind(this), id
        )
    }

    async getImage(id: string) {
        return cacheOrMiss(
            this.cache.image,
            super.getImage.bind(this),
            id
        )
    }
}