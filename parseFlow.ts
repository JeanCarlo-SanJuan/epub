import { Item } from "./traits";
import { Flow } from "./traits/Flow";
export function parseFlow(contents:Item[]): Flow {
    const flow = new Flow()
    contents.map(item =>
        flow.set(item.id, item)
    )

    return flow;
}