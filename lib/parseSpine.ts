import toArray from "./toArray";
import { RawSpine, Thing, Spine } from "./traits";
export function parseSpine({ itemref, _attributes }: RawSpine, rawManifest: Thing): Spine {
    return {
        toc: "ncx",
        contents: itemref ? toArray(itemref).map(({ _attributes: atrs }) => rawManifest[atrs.idref]):[],
        ..._attributes,
    }
}