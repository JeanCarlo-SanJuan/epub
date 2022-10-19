import { Entry} from "@zip.js/zip.js";
export interface LoadedEntry {
    file: Entry
    data: string|Blob
}