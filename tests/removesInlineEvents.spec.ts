import {removeInlineEvents} from "../lib/removeInlineEvents"

it("Removes inline events", () => {
    const elem = document.createElement("div")
    elem.setAttribute("onclick", "()=>true")
    removeInlineEvents(elem)
    expect(elem.hasAttribute("onclick")).toBe(false)
})