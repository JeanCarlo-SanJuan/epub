import * as r from "./rootPathInstance"

describe("using RootPath", () => {
    it("instantiates" , () => {
        expect(r.rootPath).toBeTruthy()
    })

    it("appends fullPath", () => {
        expect(r.rootPath.alter(r.filePath)).toBe(r.expected)
    })
    it("removes parent dir", () => {
        expect(r.rootPath.alter("../" +  r.filePath)).toBe(r.expected)
    })
    it("removes origin", () => {
        expect(r.rootPath.alter(window.location.origin + "/" +r.filePath)).toBe(r.expected)
    })
})