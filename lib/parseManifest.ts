import { stripOEBPSPrefix } from "./Reader"
import { Manifest, Item, Attribute } from "./traits"

export function parseManifest(items: Attribute<Item>[]): Manifest {
    const m: Manifest = {}
    items.map(({ _attributes:a }) => {
        // Since OEBPS/ is stripped in the entries, must also do that here
        a.href = stripOEBPSPrefix(a.href)
        m[a.id] = a
    })

    return m;
}
