export class RootPath {
    private origin:string = window.location.origin + "/";
    private array:string[]
    private str:string

    constructor(fullPath:string) {
        this.array = fullPath.split("/");
        this.array.pop()
        this.str = this.array.join("/") + "/";
    }

    alter(filepath:string):string {
        return alter(filepath, this.origin, this.str)
    }
}
function alter(filepath:string, origin:string, prefix:string):string {
    filepath = filepath
        .replace("../", "")
        .replace(origin, "")

    if (filepath.startsWith(prefix)) {
        return filepath
    }
    return prefix + filepath
}
export default RootPath;