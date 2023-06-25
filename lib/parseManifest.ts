import { Manifest, Item, Attribute } from "./traits"

export function parseManifest(items: Attribute<Item>[]): Manifest {
    const m: Manifest = {}
    items.map(({ _attributes:a }) => {
        m[a.id] = a
    })

    return m;
}
