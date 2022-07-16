import { Spine } from "../traits";

export const parsedSpine:Spine = {
    contents: [{
              id: "Cover_jpg",
              href: "oebps/Images/Cover.jpg",
              "media-type": "image/jpeg",
              properties: "cover-image",
            },
            {
              id: "text_xhtml",
              href: "oebps/Text/text.xhtml",
              "media-type": "application/xhtml+xml",
        },],
    toc:"ncx",
    _attributes:{
        "page-progression-direction": "ltr",
        "toc": "ncx"
    }
}