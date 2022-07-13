import { dotToScore } from "./dotToScore"
import { Manifest, Item, Thing } from "./traits"
import RootPath from "./RootPath"

export function parseManifest(items: Thing[], rootPath:RootPath): Manifest {
    const m:Manifest = {}
    items.map(({_attributes}) => {
        const l:Item = _attributes
        l.href = rootPath.alter(l.href)
        l.id = dotToScore(l.id)
        m[l.id] = l
    })

    return m;
}