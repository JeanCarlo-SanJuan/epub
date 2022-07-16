import {Thing} from "./Thing";
import { Attribute } from "./Attribute";
import { Item } from "./ManifestItem";
//TODO make enum type for TOC
export interface Spine {
    toc:string,
    contents:Item[],
    _attributes: {}|Thing & {
        idref:string
    }
}

export interface RawSpine extends Attribute {
    itemref: Thing 
        & { _attributes: 
        {idref:string}
        }[]
}