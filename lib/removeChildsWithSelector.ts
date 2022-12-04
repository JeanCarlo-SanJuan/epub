function removeChildsWithSelector(parent: HTMLElement | DocumentFragment , selector: string) {
    parent.querySelectorAll(selector).forEach(child => child.remove())
}

export default removeChildsWithSelector;