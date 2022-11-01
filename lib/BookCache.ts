export default class BookCache {
    text:Record<string, string> = {}
    image:Record<string, string> = {}
    setText(id:string, t:string) {
        this.text[id] = t;
    }

    setImage(id:string, base64str:string) {
        this.image[id] = base64str;
    }
}
