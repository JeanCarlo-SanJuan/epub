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
        s.contents = itemref.map(({_attributes:atrs}) => {
            const l:Item = rawManifest[dotToScore(atrs.idref)];
            l.id = dotToScore(l.id)
            return l
        })
    }
    return s; 
}