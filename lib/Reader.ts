import { BlobReader, BlobWriter, Entry, TextWriter, ZipReader } from "@zip.js/zip.js";
import { MIMEError } from "./error/MIMEError";
import * as trait from "./traits";

/**
 * Contains strings that must be matched as the Epub is parsed.
 */
export enum INFO {
    MIME = "application/epub+zip",
    TARGET = "mimetype",
    CONTAINER_ID = "META-INF/container.xml",
    OEBPS_ID = "application/oebps-package+xml",
}

export async function read(value:Blob):Promise<Reader>{
    const r = new Reader(value)
    await r.init()
    return r
}

export class Reader extends ZipReader<Blob> implements ReaderLike {
    entries: Entry[] = [];
    constructor(value: Blob) {
        super(new BlobReader(value));
    }
    container?: trait.LoadedEntry = undefined;
    /**
     * Extracts the epub files from a zip archive, retrieves file listing, and check mime type.
     */
    async init() {
        this.entries = await this.getEntries();
        // close the ZipReader
        await this.close();

        if (this.entries.length) {
            await this.checkMimeType();
        }
        else {
            throw new Error("Empty archive!");
        }

        this.container = await this.read(INFO.CONTAINER_ID);
    }
    /**
     *  Finds a file named "mimetype" and check if the content
     *  is exactly `Reader.MIME`.
     **/
    async checkMimeType() {
        const { data } = await this.read(INFO.TARGET);
        MIMEError.unless({ id: INFO.TARGET, actual: data as string, expected: INFO.MIME});
    }

    async read(name: string, type?: string): Promise<trait.LoadedEntry> {
        const file = this.partialSearch(name);
        (file as trait.LoadedEntry).data = await file.getData(
            this.determineWriter(type),
            {});

        return file as trait.LoadedEntry;
    }

    prepareGet(name: string) {
        return (predicate: (n: Entry) => boolean) => {
            const entry = this.entries.find(predicate);

            if (entry)
                return entry;

            throw new Error(`Missing entry with name ${name}`);
        };
    }

    get(name: string) {
        return this.prepareGet(name)(n => n.filename === name);
    }

    partialSearch(name: string) {
        //Remove leading '/' for paths
        const safe_name = decodeURI(name[0] == '/' ? name.slice(1) : name);
        return this.prepareGet(safe_name)(n => n.filename.includes(safe_name));
    }

    /**
     * @returns the appropriate zip writer
     */
    determineWriter(t?: string) {
        if (t?.includes("image/"))
            return new BlobWriter(t);

        else
            return new TextWriter("utf-8");
    }
}


export interface ReaderLike {
    read(name: string, type?: string): Promise<trait.LoadedEntry>
}