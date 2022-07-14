import { Item } from "./ManifestItem";
import { EnhancedMap } from "@jcsj/arraymap";

export interface Chapter extends Item {
    title:string,
    order: number
}

export class TableOfContents extends EnhancedMap<string, Chapter> {};

export enum ChapterType {
    text,
    image
}