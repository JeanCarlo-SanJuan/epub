export default class BookCache {
    text ={}
    image = {}
    setText(id:string, t:string) {
        this.text[id] = t;
    }

    setImage(id:string, blob:Blob) {
        this.image[id] = blob;
    }
}
