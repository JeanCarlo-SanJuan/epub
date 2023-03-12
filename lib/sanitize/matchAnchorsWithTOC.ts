import { Flow } from "../traits";

/**
 * Replaces chapter links inside a `DocumentFragment` with the ids from {@link Flow}.
 */
export function matchAnchorsWithFlow(frag: DocumentFragment, flow: Flow) {
    for (const a of Array.from(frag.querySelectorAll("a"))) {
        a.href = a.href
            .replace(/\.x?html?.+/, "") // Remove file extension
            .replace(/(t|T)ext\//, "#") // Remove subpath "text" and add ID anchor.
        for (const key in flow) {
            if (a.href.includes(key)) {
                a.href = '#' + key
                break;
            }
        }
    }
}