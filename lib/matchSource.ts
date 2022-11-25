import { EpubBase } from ".";

export async function matchMediaSources(epub: EpubBase, frag: DocumentFragment) {
    for (const img of Array.from(frag.querySelectorAll<HTMLImageElement | SVGImageElement>("img, image"))) {
        //TODO: Allow a default image to be used when no src.
        let key: string | undefined;
        let src: string | undefined;
        if (img instanceof HTMLImageElement) {
            key = "src"; 
            src = img.src;
        } else if (img instanceof SVGImageElement) {
            key = ["href", "xlink:href"].find(a => img.hasAttribute(a))
            if (key)
                src = img.getAttribute(key) ?? undefined;
        }

        if (src && key) {
            img.dataset.src = src;
            src = epub.rootPath.alter(src)
            for (const _id in epub.manifest) {
                if (src == epub.manifest[_id].href) {
                    img.setAttribute(key, await epub.getImage(_id));
                }
            }
        }
    }
}