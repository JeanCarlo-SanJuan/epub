import type { Entry } from "@zip.js/zip.js"
import type {LoadedEntry} from "./LoadedEntry"
export interface Info {
    archive:File,
    container:LoadedEntry,
    mime:Entry,
    rootName:string
}