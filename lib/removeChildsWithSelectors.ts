function removeChildsWithSelectors(parent: HTMLElement | DocumentFragment, ...selectors: string[]) {
    selectors.map(selector => {
        parent.querySelectorAll(selector).forEach(child => {
            child.parentNode?.removeChild(child)
        })
    })
}

export default removeChildsWithSelectors;