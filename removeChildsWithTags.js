/**
 * @param {HTMLElement} parent 
 * @param  {...String} selectors
 */
function removeChildsWith(parent, ...selectors) {
    for(const selector of selectors) {
        for (const child of parent.querySelectorAll(selector)) {
            child.parentNode.removeChild(child)
        }
    }
}

export default removeChildsWith;