import type { Entry } from "@zip.js/zip.js"
import type {LoadedEntry} from "./LoadedEntry"
export interface Info {
    archive:File|null,
    container:null|LoadedEntry,
    mime:null|Entry,
    rootName:null|string
}