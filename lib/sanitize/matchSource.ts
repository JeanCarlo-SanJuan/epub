import { DataReader } from "..";
import { Manifest } from "../traits";

export type MissingMediaHandler = (data: { img: HTMLImageElement | SVGImageElement, src: string, key: string }) => Promise<string|undefined>

export async function matchMediaSources<D extends DataReader>(d: D, m: Manifest, frag: DocumentFragment, fallback = "", handler?: MissingMediaHandler
) {
    const manifest = Object.values(m);
    for (const img of Array.from(frag.querySelectorAll<HTMLImageElement | SVGImageElement>("img, image"))) {
        const { key, src } = getSource(img);
        if (src === undefined || key === undefined) {
            throw Error(`${img} HAS NO SOURCE`)
        }

        img.dataset.src = src;

        const item = manifest.find(({ href }) =>
            src.endsWith(href)
        )

        if (item) {
            img.setAttribute(key,
                await d.getImage(item.id)
            );
            continue
        }

        img.setAttribute(key, (await handler?.({ img, src, key })) ?? fallback)
    }
}

/**
 * Gets source attribute of picture elements
 */
export function getSource(img: HTMLImageElement | SVGImageElement) {
    const key = ["src", "href", "xlink:href"].find(img.hasAttribute, img);
    return {
        key,
        src: key ? img.getAttribute(key) ?? undefined : undefined
    }
}
