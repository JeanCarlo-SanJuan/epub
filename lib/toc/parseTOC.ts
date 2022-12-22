import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { walkNavMap } from "./walkNavMap";
import { walkTOC } from "./walkTOC";
import { Manifest } from "../traits";
import { TableOfContents } from "./TableOfContents";
import { Parser } from "Parser";
export async function parseTOC<R>(manifest: Manifest, toc_id: string, parser:Parser<R>) {
    let toc: TableOfContents;
    const IDs = Object.entries(manifest)
        .reduce((o, [k, v]) => { o[v.href] = k; return o }, 
        {} as Record<string, string>)

    const item = manifest[toc_id] || manifest["toc"]
    const xml = await parser.zip2js(item.href);
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