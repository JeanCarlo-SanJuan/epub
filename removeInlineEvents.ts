const onEvent = /^on.+/i;

export function removeInlineEvents(frag:DocumentFragment) {
    frag.querySelectorAll("*").forEach(elem => {
        for (const {name} of elem.attributes) {
            if (onEvent.test(name))
                elem.removeAttribute(name);
        }
    })
}