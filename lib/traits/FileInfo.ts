import type { Entry } from "@zip.js/zip.js"
import type { LoadedEntry } from "./LoadedEntry"
export interface Info {
    container: LoadedEntry,
    mime: Entry,
}