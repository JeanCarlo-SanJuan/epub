import { Chapter, Manifest, TableOfContents, Thing } from "./traits";

export function walkTOC(body: Thing, manifest: Manifest): TableOfContents {
    let order = 0;
    const toc = new TableOfContents()
    for (const p of body.p) {
        let id = p._attributes.id
            .replace(/toc(-|:)/i, "")
            .trim()

        const element:Chapter = {
            title: p.a._text, 
            order: order++,
            ...manifest[id], 
        };

        if (element.id == undefined)
            continue;

        toc.set(id, element)
    }

    return toc;
}