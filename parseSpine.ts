import { dotToScore } from "./dotToScore";
import toArray from "./toArray";
import { RawSpine, Thing, Spine, Item } from "./traits";
export function parseSpine({itemref, _attributes}:RawSpine, rawManifest:Thing): Spine {
    const s:Spine =  {
        toc: "ncx", //TODO: move toc type identification here
        contents: [],
         ..._attributes, //Override the default props
         _attributes: {}
    }
    s.toc = dotToScore(s.toc) //Workaround: 2.0's toc filename/id may not exactly be 'ncx'.
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