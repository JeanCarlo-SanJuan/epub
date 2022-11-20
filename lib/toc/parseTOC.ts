import Epub from "../";
import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { walkNavMap } from "./walkNavMap";
import { walkTOC } from "./walkTOC";
import { Manifest } from "../traits";
import { TableOfContents } from "./TableOfContents";

export async function parseTOC(manifest: Manifest, toc_id: string, epub: Epub) {
    let toc: TableOfContents;
    const IDs = Object.entries(manifest)
        .reduce((o, [k, v]) => { o[v.href] = k; return o }, 
        {} as Record<string, string>)

    let item = manifest[toc_id] || manifest["toc"]
    const xml = await epub.zip2JS(item.href);
    if (xml.ncx) {
        const path = item.href.split("/")
        path.pop();
        toc = walkNavMap(
            {
                branch: xml.ncx.navMap.navPoint,
                path,
                IDs,
                level: 0
            }
            , manifest
        )
    } else {
        toc = walkTOC(xml.html.body, manifest);
    }

    return matchTOCWithManifest(toc, manifest)
}