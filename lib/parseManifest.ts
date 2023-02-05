import { Manifest, Item, Attribute } from "./traits"

export function parseManifest(items: Attribute[]): Manifest {
    const m: Manifest = {}
    items.map(({ _attributes:a }:{_attributes:Item}) => {
        m[a.id] = a
    })

    return m;
}