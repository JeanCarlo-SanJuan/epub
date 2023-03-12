import { matchTOCWithManifest } from "./matchTOCWithManifest";
import { walkNav, walkNavMap } from "./walkNavMap";
import { walkTOC } from "./walkTOC";
import { Manifest } from "../traits";
import { TableOfContents } from "./TableOfContents";
import { Parser } from "../Parser";
import { ReaderLike } from "../Reader";
export async function parseTOC<R extends ReaderLike>(manifest: Manifest, toc_id: string, parser:Parser<R>) {
    let toc = new TableOfContents();
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
    } else if (xml.html.body) { 
        if (xml.html.body.p) {
            toc = walkTOC(xml.html.body, manifest);
        } else if (xml.html.body.nav) {
            toc = walkNav(xml.html.body, manifest);
        }
    }

    return matchTOCWithManifest(toc, manifest)
}