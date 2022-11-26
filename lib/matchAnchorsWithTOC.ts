import { Flow } from "./traits";

/**
 * Replaces chapter links inside a `DocumentFragment` with the ids from {@link TableOfContents}.
 */
export function matchAnchorsWithFlow(frag:DocumentFragment, flow:Flow) {
    const keys = [...flow.keys()]
    for (const a of Array.from(frag.querySelectorAll("a"))) {
        a.href = a.href
            .replace(/\.x?html?.+/, "") // Remove file extension
            .replace(/(t|T)ext\//, "#") // Remove subpath "text" and add ID anchor.
        const id = keys.find(k => a.href.includes(k))
        if (id)
            a.href = '#' + id
    }
}