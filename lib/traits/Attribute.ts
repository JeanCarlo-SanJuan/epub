import {Thing} from "./Thing";

export interface Attribute extends Thing {
    _attributes: any
    [key:string]:any
}