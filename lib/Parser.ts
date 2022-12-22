import { ElementCompact } from "@jcsj/xml-js";
import { ReaderLike } from "./Reader";

export interface Parser<R extends ReaderLike> {
    reader: R;
    xml2js(data: string): ElementCompact;
    zip2js(name: string): Promise<ElementCompact>;
}