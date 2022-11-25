import { ElementCompact } from "@jcsj/xml-js";
import { MIMEError } from "./error/MIMEError";

export class RootPath {
    public origin:string;
    public str:string
    fullPath: string;
    static CONTAINER_ID = "meta-inf/container.xml"
    static OEBPS_ID = "application/oebps-package+xml"
    constructor(fullPath:string, origin?:string) {
        this.fullPath = fullPath;
        const parts = fullPath.split("/");
        parts.pop()
        this.origin = (origin ?? window.location.origin + "/") || ""
        this.str = parts.join("/") + "/";
    }

    alter(filepath:string):string {
        return alter(filepath, this.origin, this.str)
    }

    static parse(container:ElementCompact) {
        if (!container.rootfiles || !container.rootfiles.rootfile)
            throw TypeError("No rootfiles found");
    
        const d: { "full-path": string, "media-type": string } =
            container.rootfiles.rootfile._attributes;
    
        MIMEError.unless({ id: RootPath.CONTAINER_ID, actual: d["media-type"], expected: RootPath.OEBPS_ID })
    
        return new RootPath(d["full-path"])
    }
}

function alter(filepath:string, origin:string, prefix:string):string {
    filepath = filepath
        .replace("../", prefix)
        .replace(origin, "")
    return prefix + filepath
}
export default RootPath;