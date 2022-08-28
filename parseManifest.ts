import { Manifest, Item, Thing } from "./traits"
import RootPath from "./RootPath"

export function parseManifest(items: Thing[], rootPath:RootPath): Manifest {
    const m:Manifest = {}
    items.map(({_attributes}) => {
        const l:Item = _attributes
        l.href = rootPath.alter(l.href)
        m[l.id] = l
    })

    return m;
}