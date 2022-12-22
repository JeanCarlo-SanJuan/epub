import { Thing } from "./Thing"

export interface Metadata<C=string, D=string> extends Thing {
    creator: C,
    UUID: string,
    ISBN: string
    [key: string]: any
    language: string,
    date: D,
    description?: string,
    subject?: string | Thing[],
    title: string
}