import toArray from "./toArray";
import { RawSpine, Thing, Spine } from "./traits";
export function parseSpine({ itemref, _attributes }: RawSpine, rawManifest: Thing): Spine {
    const s: Spine = {
        toc: "ncx",
        contents: [],
        ..._attributes, //Override the default props
    }
    if (itemref) {
        itemref = toArray(itemref)
        s.contents = itemref.map(({ _attributes: atrs }, index) => {
            const l = rawManifest[atrs.idref];

            if (!Object.hasOwn(l, "id")) {
                throw TypeError(`Missing id at index ${index} | item, ${l}`,)
            }
            return l
        })
    }
    return s;
}