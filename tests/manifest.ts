import { Item, Manifest } from "../traits"
export const raw: { _attributes: Item }[] = [
    {_attributes: {
            id: "Cover.jpg",
            href: "oebps/Images/Cover.jpg",
            "media-type": "image/jpeg",
            properties: "cover-image"
        }},
    {_attributes:
        {
            id: "text.xhtml",
            href: "oebps/Text/text.xhtml",
            "media-type": "application/xhtml+xml"
        }
    }]

export const parsed: Manifest = {
    "Cover_jpg": {
        id: "Cover_jpg",
        href: "oebps/Images/Cover.jpg",
        "media-type": "image/jpeg",
        properties: "cover-image"
    },
    "text_xhtml": {
        "id": "text_xhtml",
        "href": "oebps/Text/text.xhtml",
        "media-type": "application/xhtml+xml"
    }
}