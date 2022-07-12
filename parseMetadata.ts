import { Metadata } from "./traits";
import {extractUUID} from "./extractUUID"
    /**
     * Emits a "parsed-metadata" event
     */
export function parseMetadata(_metadata:Metadata) {
        const metadata:Metadata = {
            creator:"",
            UUID:"",
            ISBN:""
        };
        for(const [k,v] of Object.entries(_metadata)) {
            const 
                keyparts = k.split(":"),
                key = (keyparts[keyparts.length-1] || "").toLowerCase().trim(),
                text = "" + v._text
            ;
            
            switch (key) {
                case "creator":
                    if (Array.isArray(v)) {
                        metadata.creator = v.map(item => {
                            return item._text
                        }).join(" | ")
                    } else {
                        metadata.creator = text
                    }
                    break;
                case "identifier":
                    if(Array.isArray(v)) {
                        metadata.UUID = extractUUID(v[0]._text)
                    } else if (v["opf:scheme"] == "ISBN") {
                        metadata.ISBN = text;
                    } else {
                        metadata.UUID = extractUUID(text)
                    }
                    
                    break;
                default:
                    metadata[key] = text;
            }
        }

        return metadata;
    }