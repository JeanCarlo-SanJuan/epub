import { Manifest, Item, Attribute } from "./traits"

export function parseManifest(items: Attribute[]): Manifest {
    const m:Manifest = {}
    items.map(({_attributes}) => {
        const l:Item = _attributes
        m[l.id] = l
    })

    return m;
}