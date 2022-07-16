import { dotToScore } from "./dotToScore";
import toArray from "./toArray";
import { RawSpine, Thing, Spine, Item } from "./traits";
export function parseSpine({itemref, _attributes}:RawSpine, rawManifest:Thing): Spine {
    const s:Spine =  {
        toc: "ncx", //TODO: move toc type identification here
        contents: [],
        _attributes
    }
    
    if (itemref) {
        itemref = toArray(itemref)
        s.contents = itemref.map(({_attributes:atrs}, index) => {
            const l:Item = rawManifest[dotToScore(atrs.idref)];

            if (l.hasOwnProperty("id")) {
                l.id = dotToScore(l.id)
            } else {
                throw new TypeError(`Missing id at index ${index} | item, ${l}`, )
            }
            return l
        })
    }
    return s; 
}