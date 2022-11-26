export default class BookCache {
    text:Record<string, string> = {}
    image:Record<string, string> = {}
    setText(id:string, t:string) {
        this.text[id] = t;
    }

    setImage(id:string, url:string) {
        this.image[id] = url;
    }
}
