export default class BookCache {
    text ={}
    image = {}
    setText(id:string, t:string) {
        this.text[id] = t;
    }

    setImage(id:string, base64str:string) {
        this.image[id] = base64str;
    }
}
