import { parseManifest } from "../parseManifest";
import {raw, parsed} from "./manifest"
import {rootPath} from "./roothPathInstance"
it("parses-valid-rawManifest", () => {
    const actual = parseManifest(raw, rootPath);

    expect(actual).toEqual(parsed)
})