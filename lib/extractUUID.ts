/**
 * Helper function for parsing metadata
 */
export function extractUUID(txt?:string):string {
    if (typeof txt == "string") {
        const parts = txt.toLocaleLowerCase().split(":")
        if (parts.includes("uuid"))
            return parts[parts.length - 1];
    }

    return ""
}