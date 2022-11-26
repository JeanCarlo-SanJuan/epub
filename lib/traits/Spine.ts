import { Thing } from "./Thing";
import { Attribute } from "./Attribute";
import { Item } from "./ManifestItem";
//TODO make enum type for TOC
export interface Spine extends Thing {
    toc: string,
    contents: Item[],
}

export interface RawSpine extends Attribute {
    itemref: Thing
    & {
        _attributes:
        { idref: string }
    }[]
}