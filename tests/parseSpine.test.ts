import {parsed, raw} from "./spine"
import {parsed as parsedManifest} from "./manifest"
import { parseSpine } from "../lib/parseSpine";

const s = parseSpine(raw, parsedManifest)

describe("Valid spine" , () => {
    it("parses valid spine from the raw spine based on raw manifest", () => {
        expect(s).toEqual(parsed)
    });
    
    it("contents has the same length as the raw", () => {
        expect(s.contents).toHaveLength(raw.itemref.length)
    })
    it("Keeps IDs", () => {
        const c = parsed.contents[1]
        const r = raw.itemref[1]

        expect(c.id).toBe(r._attributes.idref)
    })
})