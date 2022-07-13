import { Metadata, Thing } from "./traits";
import { extractUUID } from "./extractUUID"

export function parseMetadata(rawMetadata: Metadata):Metadata {
    const md: Metadata = {
        creator: "unknown",
        UUID: "",
        ISBN: "",
        language: "en",
        date: "unknown"
    };

    Object.entries(rawMetadata).forEach(([k,v]) => {
        const
        keyparts = k.split(":"),
        key = (keyparts[keyparts.length - 1] || "").toLowerCase().trim(),
        text = "" + v._text
        ;

        switch (key) {
            case "creator":
                md.creator = Array.isArray(v) 
                ? combineCreators(v):text
                break;
            case "identifier":
                if (Array.isArray(v)) {
                    md.UUID = extractUUID(v[0]._text)
                } else if (v["opf:scheme"] == "ISBN") {
                    md.ISBN = text;
                } else {
                    md.UUID = extractUUID(text)
                }

                break;
            default:
                md[key] = text;
        }
    })

    return md;
}

function combineCreators(v:Thing[]) {
    return v
        .map(({_text}) =>_text)
        .join(" | ")
}