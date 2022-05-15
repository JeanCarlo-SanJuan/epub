class RootPath {

    /**
     * @param {string} fullPath 
     */
    constructor(fullPath) {

        let urlWithotuAnchorsAndParameters = window.location.href.split(/[?#]/)[0];
        this.url = urlWithotuAnchorsAndParameters;
        this.array = fullPath.split("/");
        this.array.pop()
            
        this.str = (this.array.join("/") + "/");
    }

    /**
     * @param {string} filepath 
     * @returns string
     */
    alter(filepath) {
        filepath = filepath
            .replace("../", "")
            .replace(this.url, "")

        if (filepath.startsWith(this.str)) {
            return filepath
        }
        return this.str + filepath
    }
}

export default RootPath;