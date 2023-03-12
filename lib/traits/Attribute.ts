import { ElementCompact } from "@jcsj/xml-js";
import { Thing } from "./Thing";

export interface Attribute<A = ElementCompact> extends Thing {
    _attributes: A
    [key: string]: any
}