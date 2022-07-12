import { dotToScore } from "./dotToScore";
import toArray from "./toArray";
import { SpineItem, Thing, Spine } from "./traits";

export function parseSpine({itemref, _attributes}:SpineItem, manifest:Thing): Spine {
    const spine:Spine =  {
        toc: "ncx",
        contents: [],
        _attributes
    }
    if (itemref) {
        itemref = toArray(itemref)

        for (const {_attributes:atrs} of itemref) {
            const elem:Thing & {id:string} = manifest[dotToScore(atrs.idref)];
            elem.id = dotToScore(elem.id)
            spine.contents.push(elem)
        }
    }

    return spine; 
}