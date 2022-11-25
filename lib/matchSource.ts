import { EpubBase } from ".";

export async function matchMediaSources<E extends EpubBase>(epub: E, frag: DocumentFragment) {
    for (const img of Array.from(frag.querySelectorAll<HTMLImageElement | SVGImageElement>("img, image"))) {
        //TODO: Allow a default image to be used when no src.
        const {key,src} = getSource(img);
        
        if (src && key) {
            img.dataset.src = src;

            const item = Object.values(epub.manifest).find(item =>
                src?.endsWith(item.href)
            )

            if (item) {
                img.setAttribute(key, 
                    await epub.getImage(item.id)
                );
                continue;
            }

            throw Error(`${src} IS NOT IN MANIFEST`)
        }

        throw Error(`${img} HAS NO SOURCE`)
    }
}

/**
 * Gets source attribute of picture elements
 */
export function getSource(img: HTMLImageElement | SVGImageElement) {
    const key = ["src", "href", "xlink:href"].find(a => img.hasAttribute(a));
    return { 
        key, 
        src: img.getAttribute(key!) ?? undefined
    }
}