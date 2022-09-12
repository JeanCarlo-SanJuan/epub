import Epub from "..";
import { matchTOCWithManifest } from "./matchTOCWithManifest.js";
import { walkNavMap } from "./walkNavMap";
import { walkTOC } from "./walkTOC";
import {Manifest} from "../traits";
import { TableOfContents } from "./TableOfContents";

export async function parseTOC(manifest:Manifest, toc_id:string, epub:Epub) {
    let toc:TableOfContents;
    let item = manifest[toc_id] || manifest["toc"]
    const IDs = {};
    Object.entries(manifest)
        .map(([k, v]) => IDs[v.href] = k)

    /*TODOS
     * 1. Decouple xml part so this fx could be declared in its own file.
     */
    const xml = await epub.zip2JS(item.href);
    if (xml.ncx) {
        const path = item.href.split("/")
        path.pop();
        toc = walkNavMap(
            {
            branch: xml.ncx.navMap.navPoint,
            path, 
            IDs,
            level:0
            }
            , manifest
        )
    } else {
        toc = walkTOC(xml.html.body, manifest);
    }

    if(toc == undefined)
        throw new TypeError(`NO TOC found for id: ${toc_id}, input: ${manifest}`);

    return matchTOCWithManifest(toc, manifest)
}