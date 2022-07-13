export interface Metadata {
    creator:string,
    UUID:string,
    ISBN:string
    [key:string]:any
    language:string,
    date:string,
    description?:string,
    subject?:string
}