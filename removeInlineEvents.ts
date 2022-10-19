const onEvent = /^on.+/i;

export function removeInlineEvents(frag:DocumentFragment) {
    frag.querySelectorAll("*").forEach(elem => {
        for (const {name} of Object.values(elem.attributes)) {
            if (onEvent.test(name))
                elem.removeAttribute(name);
        }
    })
}