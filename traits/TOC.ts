import { Item } from "./ManifestItem";

export interface Chapter extends Item {
    title:string,
    order: number
}

export class TableOfContents extends Map<string, Chapter> {};
export interface ObjectTOC {
    [key:string]: Chapter
}