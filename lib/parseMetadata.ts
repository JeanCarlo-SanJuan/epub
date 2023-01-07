import { Metadata, Thing } from "./traits";
import { extractUUID } from "./extractUUID"

export function parseMetadata(rawMetadata: Thing): Metadata {
    const md: Metadata = {
        creator: "unknown",
        UUID: "",
        ISBN: "",
        language: "en",
        date: "unknown",
        title: ""
    };

    Object.entries(rawMetadata).forEach(([k, v]: [k: string, v: Thing]) => {
        const
            keyparts = k.split(":"),
            key = (keyparts[keyparts.length - 1] || "").trim()
            ;
        if (!Object.hasOwn(v, "_text")) {
            md[key] = v;
        } else {
            const text = "" + v._text
            switch (key) {
                case "creator":
                    md.creator = Array.isArray(v)
                        ? combineCreators(v) : text
                    break;
                case "identifier":
                    if (Array.isArray(v)) {
                        md.UUID = extractUUID(v[0]._text)
                    } else {
                        const id = v["opf:scheme"];
                        switch (id) {
                            case 'ISBN':
                                md.ISBN = text;
                                break;
                            case "URI":
                                md.URI = text;
                                break;
                            default:
                                md.UUID = extractUUID(text)
                                break;
                        }
                    }
                    break;
                default:
                    md[key] = text;
            }
        }
    })

    return md;
}

function combineCreators(v: Thing[]) {
    return v
        .map(({ _text }) => _text)
        .join(" | ")
}