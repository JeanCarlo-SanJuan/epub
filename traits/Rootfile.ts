import { ElementCompact } from "xml-js"
import {Metadata} from "./Metadata"
import {Thing} from "./Thing"
import {SpineItem} from "./Spine"
export interface RootFile extends ElementCompact{
    manifest:Thing&{
        item:[]
    },
    metadata:Metadata,
    spine:SpineItem,
    _attributes: Thing & {
        version:string|undefined, 
    }
}