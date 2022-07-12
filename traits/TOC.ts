import { Item } from "./ManifestItem";

export interface Chapter extends Item {
    title:string,
    order: number
}

export class TableOfContents extends Map<string, Chapter> {};

export enum ChapterType {
    text,
    image
}