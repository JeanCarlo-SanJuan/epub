import EV from "./EV";
import { TableOfContents } from "./toc/TableOfContents";
import * as trait from "./traits";

export interface Parts {
    metadata: Partial<trait.Metadata>;
    manifest: trait.Manifest;
    spine: trait.Spine;
    flow: trait.Flow;
    toc: TableOfContents;
    version:string;
}

/**
 * Keys here correspond to {@link Parts}
 */
export interface ProgressEvents extends
    Partial<Record<EV, CallableFunction>> { 
    root?:(root_path:string)=>void,
    manifest?:(m:trait.Manifest)=>void,
    metadata?:(m:Partial<trait.Metadata>)=>void,
    spine?:(s:trait.Spine)=>void,
    flow?:(f:trait.Flow)=>void,
    toc?:(t:TableOfContents)=>void,
    loaded?:(p:Parts)=>void,
}
