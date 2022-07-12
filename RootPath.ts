class RootPath {
    private origin:string = window.location.origin + "/";
    private array:string[]
    private str:string

    constructor(fullPath:string) {
        this.array = fullPath.split("/");
        this.array.pop()
        this.str = this.array.join("/") + "/";
    }

    alter(filepath:string):string {
        filepath = filepath
            .replace("../", "")
            .replace(this.origin, "")

        if (filepath.startsWith(this.str)) {
            return filepath
        }
        return this.str + filepath
    }
}

export default RootPath;