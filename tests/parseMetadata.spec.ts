import {parsed, raw} from "./rawMetadata"
import {parseMetadata} from "../parseMetadata"
import { Metadata } from "../traits";
it("parses valid raw metadata", () => {
    const actual = parseMetadata(raw);

    expect(actual).toMatchObject<Metadata>(parsed)
})