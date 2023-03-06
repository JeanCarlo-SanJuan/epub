import { Chapter, Manifest, Thing } from "../traits";
import { TableOfContents } from "./TableOfContents";

/**
 * For Epub3
 */
export function walkTOC(body: Thing, manifest: Manifest): TableOfContents {
    const toc = new TableOfContents()
    body.p ??= [];
    let order = 0;
    for (const p of body.p) {
        const id = p._attributes.id
            .replace(/toc(-|:)/i, "")
            .trim()

        const element: Chapter = {
            title: p.a._text,
            order: order++,
            ...manifest[id],
        };

        if (element.id) {
            toc.set(id, element);
        }
    }

    return toc;
}