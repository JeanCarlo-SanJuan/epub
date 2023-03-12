import toArray from "../toArray";
import { Attribute, Item, Manifest } from "../traits";
import * as Nav from "./NavTree";
import { TableOfContents } from "./TableOfContents";

function walkBranch(
    ol: Attribute & { li: Attribute },
    m: Manifest,
    order = 0,
    level = 0) {
    const output: TableOfContents = new TableOfContents();

    // limit depth
    if (level > 7 || ol === undefined)
        return output;

    for (const li of toArray(ol.li)) {
        const a: Item = li.a;
        const element: Nav.Leaf = {
            level,
            order: order++,
            title: a._text,
            href: a._attributes.href,
            id: a._attributes.id,
            "media-type": ""
        };
        // TODO link existing object
        // element = { ...manifest[element.id], title: element.title, order, level };
        if (li.ol) {
            element.navPoint = walkBranch(li.ol, m, order, level++);
        }
        output.set(element.id, element)
    }

    return output;
}
/**
 * For Epub3
 */
export function walkNav
    ({
        nav,
        level = 0
    },
        manifest: Manifest
    ) {

    if (nav.ol) {
        return walkBranch(nav.ol, manifest, 0, level)
    } else
        //Some navs are arrays
        if (nav.length) {
            return walkBranch(nav[0].ol, manifest, 0, level)
        }
    return new TableOfContents();
}

/**
 * For Epub2 ncx
 */
export function walkNavMap
    ({ branch, path, IDs, level = 0 }: Nav.Node,
        manifest: Manifest
    ) {
    const output: TableOfContents = new TableOfContents();
    // limit depth
    if (level > 7 || branch === undefined)
        return output;

    let order = 0;
    for (const part of toArray(branch)) {
        let href: string = part.content._attributes.src;
        
        if (href)
        href = path.concat([href.trim()]).join("/");
        else
        continue;
        
        let title = "";
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