import { RawSpine} from "../traits/Spine"
import {parseSpine} from "../parseSpine"
import {parsedSpine} from "./spine"
import {parsed as parsedManifest} from "./manifest"
test("can-parse-valid-RawSpine-and-RawManifest", () => {
    const rawSpine:RawSpine = {
        itemref: [
            {_attributes: {
                idref:"Cover_jpg"
            }},
            {_attributes: {
                idref:"text"
            }}
        ],
        
        _attributes: {
            "page-progression-direction": "ltr",
            "toc": "ncx"
        }
    }
    
    const s = parseSpine(rawSpine, parsedManifest)
    expect(s).toEqual(parsedSpine)
});