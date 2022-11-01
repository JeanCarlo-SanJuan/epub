import { Metadata } from "../lib/traits"

export const parsed:Metadata = {
    "creator": "Lewis Carroll",
    "UUID": "",
    "ISBN": "",
    "language": "en",
    "date": [
        {
            "_attributes": {
                "opf:event": "publication"
            },
            "_text": "2006-08-12"
        },
        {
            "_attributes": {
                "opf:event": "conversion"
            },
            "_text": "2010-02-16T12:34:12.754941+00:00"
        }
    ],
    "rights": "Public domain in the USA.",
    "identifier": "http://www.gutenberg.org/ebooks/19033",
    "contributor": "Gordon Robinson",
    "title": "Alice's Adventures in Wonderland",
    "subject": [
        {
            "_text": "Fantasy"
        },
        {
            "_text": "Fantasy fiction, English"
        }
    ],
    "source": "http://www.gutenberg.org/files/19033/19033-h/19033-h.htm",
    "meta": {
        "_attributes": {
            "content": "item32",
            "name": "cover"
        }
    }
}

export const raw = {
    "dc:rights": {
        "_text": "Public domain in the USA."
    },
    "dc:identifier": {
        "_attributes": {
            "id": "id",
            "opf:scheme": "URI"
        },
        "_text": "http://www.gutenberg.org/ebooks/19033"
    },
    "dc:contributor": {
        "_attributes": {
            "opf:file-as": "Robinson, Gordon",
            "opf:role": "ill"
        },
        "_text": "Gordon Robinson"
    },
    "dc:creator": {
        "_attributes": {
            "opf:file-as": "Carroll, Lewis"
        },
        "_text": "Lewis Carroll"
    },
    "dc:title": {
        "_text": "Alice's Adventures in Wonderland"
    },
    "dc:language": {
        "_attributes": {
            "xsi:type": "dcterms:RFC4646"
        },
        "_text": "en"
    },
    "dc:subject": [
        {
            "_text": "Fantasy"
        },
        {
            "_text": "Fantasy fiction, English"
        }
    ],
    "dc:date": [
        {
            "_attributes": {
                "opf:event": "publication"
            },
            "_text": "2006-08-12"
        },
        {
            "_attributes": {
                "opf:event": "conversion"
            },
            "_text": "2010-02-16T12:34:12.754941+00:00"
        }
    ],
    "dc:source": {
        "_text": "http://www.gutenberg.org/files/19033/19033-h/19033-h.htm"
    },
    "meta": {
        "_attributes": {
            "content": "item32",
            "name": "cover"
        }
    }
}