import { Item, Flow } from "./traits";
export function parseFlow(contents: Item[]): Flow {
    const flow = new Flow()
    contents.map(item =>
        flow.set(item.id, item)
    )

    return flow;
}