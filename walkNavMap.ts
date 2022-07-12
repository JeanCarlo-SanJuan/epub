import toArray from "./toArray";
import { Nav, Manifest, TableOfContents } from "./traits";

export function walkNavMap
({branch, path, IDs, level = 0}:Nav.Node, 
manifest:Manifest
) {
    // limit depth
    if (level > 7)
        return undefined;
    const output:TableOfContents = new TableOfContents();
    
    for (const part of toArray(branch)) {
        let title = "";
            
        if (part.navLabel)
            title = (part.navLabel.text._text || part.navLabel).trim()

        let order = Number(part._attributes.playOrder) || 0

        let href:string = part.content._attributes.src;

        if (href == null)
            continue;
        else
            href = href.trim();

        let element:Nav.Leaf = {
            level: level,
            order: order,
            title: title,
        };

        element.href = path.concat([href]).join("/");

        const id = IDs[element.href] || null

        if (id == null) // use new one
            element.id = (part._attributes.id || "").trim();
        else { // link existing object
            element = {... manifest[id], title, order, level};
            element.id = element.id.replace('.','_')
            element.navPoint = (part.navPoint) ?
                walkNavMap(
                    {
                        "branch": part.navPoint,
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