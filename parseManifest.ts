import { dotToScore } from "./dotToScore"
import { Manifest, Item } from "./traits"
import RootPath from "./RootPath"

export function parseManifest(items: any[], rootPath:RootPath): Manifest {
    const manifest:Manifest = {}
    for(const item of items) {
        const elem:Item = item._attributes
        elem.href = rootPath.alter(elem.href)
        elem.id = dotToScore(elem.id)
        manifest[elem.id] = elem
    }

    return manifest;
}