import { Thing } from "./Thing"

export interface Metadata {
    creator:string,
    UUID:string,
    ISBN:string
    [key:string]:any
    language:string,
    date:string|any,
    description?:string,
    subject?:string|Thing[]
}