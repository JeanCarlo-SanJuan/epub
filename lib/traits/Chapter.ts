import { Item } from "./ManifestItem";

export interface Chapter extends Item {
    title: string,
    order: number,
    navPoint?: Map<string, Chapter>
}

export enum ChapterType {
    text,
    image
}
