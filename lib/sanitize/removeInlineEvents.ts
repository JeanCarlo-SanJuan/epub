export function removeInlineEventsInFragment(frag: DocumentFragment) {
    frag.querySelectorAll("*").forEach(removeInlineEvents)
}

export function removeInlineEvents(elem:Element) {
    for (const name of elem.getAttributeNames()) {
        if (name.startsWith("on")) {
            elem.removeAttribute(name);
        }
    }
}