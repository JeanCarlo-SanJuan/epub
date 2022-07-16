export interface Item {
    id:string,
    href:string,
    "media-type":string,
    [key:string]:any
}

export interface Manifest {
    [key:string]:Item
}