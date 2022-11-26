import { ElementCompact } from "@jcsj/xml-js"
import { Metadata } from "./Metadata"
import { Thing } from "./Thing"
import { RawSpine } from "./Spine"
export interface RootFile extends ElementCompact {
    manifest: Thing & {
        item: []
    },
    metadata: Metadata,
    spine: RawSpine,
    _attributes: Thing & {
        version: string | undefined,
    }
}