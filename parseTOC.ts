import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { Manifest, TableOfContents } from "./traits";
import { walkTOC } from "./walkTOC";
import {walkNavMap} from "./walkNavMap"
export async function parseTOC(manifest:Manifest, toc_id:string) {
    const hasNCX = Boolean(toc_id)
    let toc:TableOfContents|undefined, 
    tocElem = manifest[
        (hasNCX) ? toc_id:"toc"
    ]
    const IDs = {};
    Object.entries(manifest).map(([k, v]) => {
        IDs[v.href] = k;
    })
    
    //TODO: error msg
    const xml = await this.zip2JS(tocElem.href);
    if (hasNCX) {
        const path = tocElem.href.split("/")
        path.pop();
        toc = this.walkNavMap(
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

    return {hasNCX, toc: matchTOCWithManifest(toc, manifest)}
}