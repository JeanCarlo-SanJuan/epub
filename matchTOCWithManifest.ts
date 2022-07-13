import { Manifest } from "./traits";
import { TableOfContents } from "./traits/TOC";

export function matchTOCWithManifest(toc:TableOfContents, manifest:Manifest) {
    for (const [id, elem] of toc) {

        if (elem.href.includes(id)) {
            continue
        }
        
        let [href] = elem.href
            //Removes l/r white space and anchor
            .trim()
            .split("#", 1);

        //TODO: Optimize
        for (const key in manifest) {
            if (href == manifest[key].href) {
                elem.id = key;
                break;
            }
        }
    }

    return toc
}