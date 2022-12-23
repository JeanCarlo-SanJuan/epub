import EV from "./EV";
import * as trait from "./traits";
import { ElementCompact, Options, xml2jsCompact } from "@jcsj/xml-js";
import { Parser } from "./Parser";
import { Parts, ProgressEvents } from "./Parts";
import { MIMEError } from "./error/MIMEError";
import { parseManifest } from "./parseManifest";
import { parseMetadata } from "./parseMetadata";
import { parseSpine } from "./parseSpine";
import { parseFlow } from "./parseFlow";
import { parseTOC } from "./toc/parseTOC";
import { INFO, read, Reader, ReaderLike } from "./Reader";
import { TableOfContents } from "./toc/TableOfContents";
import { UnknownItemError } from "./error/UnkownItemError";

export interface BuilderParser<R extends ReaderLike> extends Parser<R> {
    container: ElementCompact,
    root_path: string,
}

export interface JSParser extends BuilderParser<Reader> {
    container: ElementCompact,
    root_path: string,
    root_xml: ElementCompact
}
export interface DataReader {
    getContent(id: string): Promise<string>;
    getImage(id: string): Promise<string>;
}
export interface Searcher {
    filter(predicate: (
        value: trait.Item,
        index: number, array:
            trait.Item[]) => boolean
    ): trait.Item[];
    matchAll(re: RegExp | string): trait.Item[];
    searchManifestOrPanic(id: string): trait.Item;
}
export interface Epub extends DataReader, Searcher {
    parts: Parts;
    parser: JSParser;
}

export interface EpubArgs {
    blob: Blob;
    events: ProgressEvents;
}
export async function open({ blob, events }: EpubArgs) {
    const emit = prepareEmit(events);

    const parser = await parse(blob, undefined);
    emit(EV.root, parser.root_xml);

    async function parseRootFile({ package: pkg }: { package: trait.RootFile }): Promise<Parts> {
        const parts: Parts = {
            metadata: {},
            manifest: {},
            spine: {
                toc: "",
                contents: []
            },
            flow: new trait.Flow,
            toc: new TableOfContents(),
            version: pkg._attributes.version ?? "2.0"
        }

        parts.metadata = parseMetadata(pkg.metadata);
        emit(EV.metadata, parts.metadata);

        parts.manifest = parseManifest(pkg.manifest.item);
        emit(EV.manifest, parts.manifest);

        parts.spine = parseSpine(pkg.spine, parts.manifest);
        emit(EV.spine, parts.spine);

        parts.flow = parseFlow(parts.spine.contents);
        emit(EV.flow, parts.flow);

        parts.toc = await parseTOC(parts.manifest, parts.spine.toc, parser);

        if (parts.toc) {
            emit(EV.toc, parts.toc);
            emit(EV.loaded);
        } else {
            throw TypeError("NO TOC")
        }

        return parts;
    }

    //TODO: Remove coercion
    return {
        parts:await parseRootFile(parser.root_xml as any),
        parser
    }
}

export interface RetrieverArgs<R extends ReaderLike> {
    parts: Parts;
    parser: Parser<R>;
}

export interface Retriever extends Searcher, DataReader {

}

export const ALLOWED_MIMES = /^(application\/xhtml\+xml|image\/svg\+xml|text\/css)$/i;

export async function Retriever<R extends ReaderLike>({ parts, parser }: RetrieverArgs<R>): Promise<Retriever> {
    const r:Retriever = {
        /**
        * TODO: Use TS Array.filter definition
        */
        filter(predicate) {
            return Object.values(parts.manifest).filter(predicate)
        },
        matchAll(re: RegExp | string) {
            const cb: (item: trait.Item) => boolean = (typeof re === "string") ?
                item => item.id.includes(re)
                : item => re.test(item.id)

            return this.filter(cb)
        },

        searchManifestOrPanic(id: string) {
            const l = parts.manifest[id]
            if (l === undefined)
                throw new UnknownItemError(`Unkown manifest item: ${id}`);

            return l;
        },

        /**
         * @param {string} id :Manifest id value for the content
         * @returns {Promise<string>} : Raw Chapter text for mime type application/xhtml+xml
         **/
        async getContent(id: string): Promise<string> {
            const elem = this.searchManifestOrPanic(id)

            MIMEError.unless({ id, actual: elem["media-type"], expected: ALLOWED_MIMES })

            return (await parser.reader.read(elem.href, elem["media-type"])).data.toString();
        },

        /**
         *  Return only images with mime type image
         * @param {string} id of the image file in {@link trait.manifest}
         * @returns {Promise<string>} Returns a promise with the data's ObjectURL
         */
        async getImage(id: string): Promise<string> {
            const item = this.searchManifestOrPanic(id)
            MIMEError.unless({ id, actual: item["media-type"].trim(), expected: /^image\//i })

            const entry = (await parser.reader.read(item.href, item["media-type"]))
            return URL.createObjectURL(entry.data as Blob);
        },
    };

    return r;
}
export async function epub(a: EpubArgs): Promise<Epub> {
    const base = await open(a);
    const r = await Retriever(base);

    return {
        ...base,
        ...r
    };
}

export function prepareEmit(listeners: ProgressEvents) {
    return (ev: EV, ...args:any[]) => listeners[ev]?.(...args)
}

export async function parse(b: Blob, o: Options.XML2JSON = {
    compact: true,
    spaces: 0
}): Promise<JSParser> {
    const r = await read(b);
    const p: Parser<Reader> = {
        reader: r,
        xml2js(data: string): ElementCompact {
            return xml2jsCompact(data, o)
        },
        async zip2js(name: string) {
            const { data } = await r.read(name);
            return this.xml2js(data as string);
        }
    }

    const container = await parseContainer(p);
    const root_path = getRootPath(container);
    const root_xml = await handleRootfile(r, p.xml2js, root_path);

    return {
        ...p,
        container,
        root_path,
        root_xml
    }
}

export async function handleRootfile(r: ReaderLike, xml2js: typeof xml2jsCompact, root_path: string) {
    const entry = await r.read(root_path)
    return xml2js(entry.data.toString())
}

export function getRootPath(container: ElementCompact) {
    if (!container.rootfiles || !container.rootfiles.rootfile)
        throw TypeError("No rootfiles found");

    const d: { "full-path": string, "media-type": string } =
        container.rootfiles.rootfile._attributes;

    MIMEError.unless({
        id: INFO.CONTAINER_ID,
        actual: d["media-type"],
        expected: INFO.OEBPS_ID
    })

    return d["full-path"];
}

export async function parseContainer<R extends ReaderLike>(p: Parser<R>) {
    const maybeContainer = await p.reader.read(INFO.CONTAINER_ID);

    return p.xml2js(maybeContainer.data
        .toString()
        .toLowerCase()
        .trim()
    ).container as ElementCompact;
}