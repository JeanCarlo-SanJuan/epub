import toArray from "../toArray";
import { Manifest } from "../traits";
import * as Nav from "./NavTree";
import { TableOfContents } from "./TableOfContents";

export function walkNavMap
    ({ branch, path, IDs, level = 0 }: Nav.Node,
        manifest: Manifest
    ) {
    const output: TableOfContents = new TableOfContents();
    // limit depth
    if (level > 7)
        return output;

    let order = 0;
    for (const part of toArray(branch)) {
        let title = "";
        let href: string = part.content._attributes.src;

        if (href)
            href = path.concat([href.trim()]).join("/");
        else
            continue;

        try {
            if (part.navLabel)
                title = (part.navLabel.text._text || part.navLabel).trim() || ""
        } catch (error) {
            //PASS
        }
        
        if (part._attributes.playOrder) {
            const _order = parseInt(part._attributes.playOrder)
            if (isNaN(_order)) {
                order++
            }
        } else {
            order++
        }
        let element: Nav.Leaf = {
            level,
            order,
            title,
            href,
            id: IDs[href],
            "media-type": ""
        };

        if (element.id === undefined) // use new one
            element.id = part._attributes.id.trim() || "";
        else { // link existing object
            element = { ...manifest[element.id], title, order, level };
            element.navPoint = (part.navPoint) ?
                walkNavMap(
                    {
                        branch: part.navPoint,
                        path,
                        IDs,
                        level: level + 1
                    }
                    , manifest
                )
                : undefined;
        }

        output.set(element.id, element)
    }

    return output;
}