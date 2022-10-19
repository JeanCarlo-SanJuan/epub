import { Item } from "./ManifestItem";

export interface Chapter extends Item {
    title:string,
    order: number
}

export enum ChapterType {
    text,
    image
}