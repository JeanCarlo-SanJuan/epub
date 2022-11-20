function removeChildsWithSelectors(parent: HTMLElement | DocumentFragment, ...selectors: string[]) {
    selectors.map(selector => {
        parent.querySelectorAll(selector).forEach(child =>
            child.remove()
        )
    })
}

export default removeChildsWithSelectors;