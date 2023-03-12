import { DataReader } from "..";
import { Manifest } from "../traits";

export async function matchMediaSources<D extends DataReader>(d:D, m:Manifest, frag: DocumentFragment) {
    for (const img of Array.from(frag.querySelectorAll<HTMLImageElement | SVGImageElement>("img, image"))) {
        //TODO: Allow a default image to be used when no src.
        const { key, src } = getSource(img);
        if (src === undefined || key === undefined) {
            throw Error(`${img} HAS NO SOURCE`)
        }
        
        img.dataset.src = src;

        const item = Object.values(m).find(item =>
            src?.endsWith(item.href)
        )
        
        if (item) {
            img.setAttribute(key,
                await d.getImage(item.id)
            );
            continue
        }

        throw Error(`${src} IS NOT IN MANIFEST`)
    }
}

/**
 * Gets source attribute of picture elements
 */
export function getSource(img: HTMLImageElement | SVGImageElement) {
    const key = ["src", "href", "xlink:href"].find(a => img.hasAttribute(a));
    return {
        key,
        src: key ? img.getAttribute(key) ?? undefined : undefined
    }
}