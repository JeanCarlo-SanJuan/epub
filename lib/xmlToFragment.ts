import removeChildsWith from "./removeChildsWithSelectors"
export function xmlToFragment(text:string, id:string): DocumentFragment {
    const p = new DOMParser()
    let xmlD = p.parseFromString(text, "application/xhtml+xml");
    const b = xmlD.querySelector("body")
    if (b === null) {
        throw new Error("No body tag for ID: " + id)
    }

    const f = document.createElement("template")
    f.innerHTML = b.innerHTML;
    removeChildsWith(b, "script", "style");
    return f.content;
}