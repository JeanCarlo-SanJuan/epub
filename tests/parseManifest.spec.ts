
import { parseManifest } from "../lib/parseManifest";
import {raw, parsed} from "./manifest"
import {rootPath} from "./rootPathInstance"
it("parses valid raw manifest", () => {
    const actual = parseManifest(raw, rootPath);

    expect(actual).toEqual(parsed)
})