import { parseMetadata } from "../lib/parseMetadata";
import { Metadata } from "../lib/traits";
import {parsed, raw} from "./rawMetadata"

it("parses valid raw metadata", () => {
    const actual = parseMetadata(raw);

    expect(actual).toMatchObject<Metadata>(parsed)
})