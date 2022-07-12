import { Thing } from "./Thing";
import { Item } from "./ManifestItem";
import { Attribute } from "./Attribute";
import { TableOfContents } from "./TOC";
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