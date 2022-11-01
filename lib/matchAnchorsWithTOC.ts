import { TableOfContents } from "./toc/TableOfContents";

/**
 * Replaces chapter links inside a `DocumentFragment` with the ids that can be used for referral in the TOC.
 */
export function matchAnchorsWithTOC(frag:DocumentFragment, toc:TableOfContents) {
    frag.querySelectorAll("a").forEach(a => {
        a.href = a.href
            .replace(/\.x?html?.+/, "") // Remove file extension
            .replace(/(t|T)ext\//, "#") // Remove subpath "text" and add ID anchor.
        const id = a.hash.slice(1);
        for (const k in toc) {
            if (k.includes(id)) {
                a.href = '#' + k
                break;
            }
        }
    })
}