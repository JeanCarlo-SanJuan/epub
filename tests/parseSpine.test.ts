import {parseSpine} from "../parseSpine"
import {parsed, raw} from "./spine"
import {parsed as parsedManifest} from "./manifest"

const s = parseSpine(raw, parsedManifest)

describe("Valid spine" , () => {
    it("parses valid spine from the raw spine based on raw manifest", () => {
        expect(s).toEqual(parsed)
    });
    
    it("contents has the same length as the raw", () => {
        expect(s.contents).toHaveLength(raw.itemref.length)
    })
    it("changes period from file extensions into an underscore", () => {
        const c = parsed.contents[1]
        const r = raw.itemref[1]

        expect(c.id).not.toBe(r._attributes.idref)
    })
})