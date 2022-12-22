/**
 * Helper function for parsing metadata
 */
export function extractUUID(txt?:string):string {
    if (typeof txt == "string") {
        return txt.replace("uuid:","");
    }

    return ""
}