import removeChildsWith from "./removeChildsWithSelector"

export function xmlToFragment(text:string, id:string): DocumentFragment {
    const p = new DOMParser()
    const xmlD = p.parseFromString(text, "application/xhtml+xml");
    const b = xmlD.querySelector("body")
    if (b === null) {
        throw new Error("No body tag for ID: " + id)
    }
    const f = document.createElement("template")
    f.innerHTML = b.innerHTML;
    removeChildsWith(f, "script, style");
    return f.content;
}