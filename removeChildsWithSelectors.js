/**
 * @param {HTMLElement} parent 
 * @param  {...String} selectors
 */
function removeChildsWithSelectors(parent, ...selectors) {
    for(const selector of selectors) {
        for (const child of parent.querySelectorAll(selector)) {
            child.parentNode.removeChild(child)
        }
    }
}

export default removeChildsWithSelectors;