import { Entry } from "@zip.js/zip.js";
export interface LoadedEntry extends Entry {
    data: string | Blob
}