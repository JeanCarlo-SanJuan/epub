import type { Entry } from "@zip.js/zip.js"
import type LoadedEntry from "./EntryWithData"
export interface FileInfo {
    archive:File|null,
    container:null|LoadedEntry<string>,
    mime:null|Entry,
    rootName:null|string
}