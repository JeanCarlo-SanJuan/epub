//Replaces SVG <image> with <img>.
export function replaceSVGImageWithIMG(frag:DocumentFragment) {
    frag.querySelectorAll("svg").forEach(svg => {
        const image = svg.querySelector("image")
        if (image == null)
            return

        const img = new Image();
        img.dataset.src = image.getAttribute("xlink:href") || undefined;
        svg.parentNode?.replaceChild(img, svg)
    })
}