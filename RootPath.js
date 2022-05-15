class RootPath {

    /**
     * @param {string} fullPath 
     */
    constructor(fullPath) {
        this.array = fullPath.split("/");
        this.array.pop()
        this.str = this.array.join("/") + "/";
    }

    /**
     * @param {string} filepath 
     * @returns string
     */
    alter(filepath) {
        filepath = filepath
            .replace("../", "")
            .replace(window.location.href, "")

        if (filepath.startsWith(this.str)) {
            return filepath
        }

        return this.str + filepath
    }
}

export default RootPath;