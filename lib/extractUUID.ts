/**
 * Helper function for parsing metadata
 */
export function extractUUID(txt:string|any):string {
    if (typeof txt == "string") {
        txt = txt.toLowerCase()
        let parts = txt.split(":")
        if (parts.includes("uuid"))
            return parts[parts.length - 1];
    }

    return ""
}