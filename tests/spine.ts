import { RawSpine, Spine } from "../traits";

export const parsed: Spine = {
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
    }, {
        id: "sample-1_xhtml",
        href: "oebps/Text/sample-1.xhtml",
        "media-type": "application/xhtml+xml",
    },],
    toc: "ncx",
    _attributes: {
        "page-progression-direction": "ltr",
        "toc": "ncx"
    }
}

export const raw:RawSpine = {
    itemref: [
        {_attributes: {
            idref:"Cover.jpg"
        }},
        {_attributes: {
            idref:"text.xhtml"
        }},
        {_attributes: {
            idref:"sample-1.xhtml"
        }}
    ],
    
    _attributes: {
        "page-progression-direction": "ltr",
        "toc": "ncx"
    }
}