export interface Item {
    id:string,
    href:string,
    "media-type":string
}

export interface Manifest {
    [key:string]:Item
}