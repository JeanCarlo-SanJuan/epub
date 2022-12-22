import EV from "./EV";
import { TableOfContents } from "./toc/TableOfContents";
import * as trait from "./traits";


export interface EpubParts {
    metadata: Partial<trait.Metadata>;
    manifest: trait.Manifest;
    spine: trait.Spine;
    flow: trait.Flow;
    toc: TableOfContents;
    version:string;
}

/**
 * Keys here correspond {@link EpubParts}
 */
export interface ProgressEvents extends
    Partial<Record<EV, any>> { 
    root?:()=>void,
    manifest?:(m:trait.Manifest)=>void,
    metadata?:(m:trait.Metadata)=>void,
    spine?:(s:trait.Spine)=>void,
    flow?:(f:trait.Flow)=>void,
    toc?:(t:TableOfContents)=>void
}