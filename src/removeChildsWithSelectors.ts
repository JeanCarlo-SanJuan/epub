function removeChildsWithSelectors(parent:HTMLElement|DocumentFragment, ...selectors:string[]) {
    for(const selector of selectors) {
        for (const child of parent.querySelectorAll(selector)) {
            child.parentNode?.removeChild(child)
        }
    }
}

export default removeChildsWithSelectors;