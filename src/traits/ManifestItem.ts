export interface Item extends Object{
    id:string,
    href:string,
    "media-type":string,
    [key:string]:any
}

export interface Manifest {
    [key:string]:Item
}