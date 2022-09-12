import { Thing } from "../traits/Thing";
import { Item } from "../traits/ManifestItem";
import { Attribute } from "../traits/Attribute";
import { TableOfContents } from "./TableOfContents";
export interface Node{
    branch?: TableOfContents;
    path: string[];
    level: number;
    IDs:Thing
}

export interface Leaf extends Item {
    level:number;
    order:number;
    title:string;
    navPoint?:TableOfContents;
}


export interface RawLeaf extends Attribute {
    navLabel:Thing
}