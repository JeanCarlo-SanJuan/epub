import { Manifest } from "../traits";
import { TableOfContents } from "./TableOfContents";

export function matchTOCWithManifest(toc:TableOfContents, manifest:Manifest) {
    toc.forEach((elem, id) => {
        if (elem.href.includes(id))
            return;

        //Removes l/r white space and anchor
        const [href] = elem.href
            .trim()
            .split("#", 1);

        for (const key in manifest) {
            if (href == manifest[key].href) {
                elem.id = key;
                break;
            }
        }
    })

    return toc
}