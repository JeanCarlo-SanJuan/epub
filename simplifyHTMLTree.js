/**
 * 
 * @param {HTMLDivElement} fragment
 * @returns {HTMLDivElement}
 * Simplifies HTML structure of chapters by keeping the nearest descendant that contains the actual text as well as removing containers for IMGs.
 */
function simplifyHTMLTree(fragment) {
    let rootElem = fragment
    let end = false;
    
    while(!end) {
        switch(rootElem.childElementCount) {
            case 0:
                //If the deepest descendant is an IMG then it must be a cover page.
                if (rootElem.tagName == "IMG") {
                    end = "COVER";
                } else {
                    rootElem = rootElem.parentElement
                }
            break;
            case 1:
                rootElem = rootElem.firstElementChild
            break;

            //If there are multiple childs then this must be a chapter.
            default:
                end = "CHAPTER";
            break;
        }
    }
    if (end == "COVER") {
        const div = document.createElement("div")
        div.appendChild(rootElem)
        return div;
    }

    for (const IMG of rootElem.querySelectorAll("IMG")) {
        if (rootElem.isSameNode(IMG.parentElement)) {
            continue
        }

        let elem = IMG.parentElement;
        //Locates the root's direct child that the IMG element descends from, then replaces it with the IMG. Note that the previous descendant is removed.
        while(true) {            
            if (rootElem.isSameNode(elem)) {
                rootElem.replaceWith(IMG , elem)
                break;
            } else {
                elem = elem.parentElement
            }
        }
    }

    return rootElem
}

export default simplifyHTMLTree;