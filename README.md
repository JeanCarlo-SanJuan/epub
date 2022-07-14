

**NB!** Only ebooks in UTF-8 are currently supported!.

## Usage 

```js
import Epub from '@jcsj/epub'
const epub = new Epub(file)
```
Where
  * **file** is an instance of the File class of an EPUB file.

Before the contents of the ebook can be read, it must be opened (`Epub` is an `EventEmitter`).

As of 1.6, one should use the EV enum.
It represents the events that will be fired as parts of the book is parsed. Epub readers may use it to speed-up preview.
```js
import {EV} from "@jcsj/epub"

epub.on(EV.metadata, async()=> {
  console.log(epub.metadata.title)
})

epub.on(EV.loaded, async() => {
  let text = await epub.getContent('chapter_id')
})

epub.open()
```

## Item
An object/interface that contains basic file info from the archive. It is the most important structure as the manifest, flow, toc uses or extends it.
It has the following propperties:
1. **id** - Unique id of the file. Most methods use this as a parameter.
1. **href** - path of the file if it were in a filesystem.
1. **media-type** - The type of the file.

## manifest
Contains all the files of the epub archive as an object whose values implement *Item*.

```js
epub.manifest
```

## metadata
Property of the *epub* object that holds several metadata fields about the book.

```js
epub.metadata
```

Available fields:
  * **creator** Author of the book (if multiple authors, will be seperated with '|') (*Lewis Carroll*)
  * **title** Title of the book (*Alice's Adventures in Wonderland*)
  * **date** creation of the file (*2006-08-12*)
  * **language** Language code (*en* or *en-us* etc.)
  * **subject?** Topic of the book (*Fantasy*)
  * **description?**
  * **UUID?** UUID string
  * **ISBN?** ISBN string

## flow

An instance of Flow class which is a Map whose values implement `Item`. It is basically a slice of **manifest**. The values hold the actual list of chapters (TOC is just an indication and can link to a # url inside a chapter file).

```js
epub.flow.forEach([key, value] => {
  //Note: key == chapter.id
    console.log(chapter.id)
})
```

Chapter `id` is needed to load the chapters with `getContent`

## toc
It is an instance of **TableOfContents** that extends **Map** whose values implement **Chapter** . It is basically a slice of **Flow**. It indicates a list of titles/urls for the TOC. Actual chapter(the file) is accessed with the `href` property.

## Chapter
An extension of **Item** with the following additional properties:
1. **order** - int
2. **title** - string

## async getContent(chapter_id)

Loads chapter text from the ebook as a promise. It is altered to be web safe. Additionally, the result is cached.
1. Keeps only the body tag.
1. Removes scripts, styles, and event handlers
1. Converts SVG IMG as a normal img tag.
1. Replaces the original image.src with the embedded base64.
1. Previous src is saved in dataset.src.

```js
let text = await epub.getContent('chapter1')
```

## async getContentRaw(chapter_id)

Load raw chapter text from the ebook.

## async getImage(image_id)
Load's image as a base64 string from the ebook. This can be used as the src of an HTML img element. Additionally, the result is cached. 
```js
const coverImage = await epub.getImage('cover');

//Example application:
const imageElement = document.createElement("img")
imageElement.src = coverImage
document.body.appendChild(imageElement)
```

## async readFile(id, writer="text")
Loads a file's content from the ebook as an object with the following properties: 
1. **file** - zip.Entry
1. **data** - string.
* the writer determines the data's string representation:
  1. "text" for chapter data in utf-8.
  1. "image" for base64 string of an image.
```js
const {file, data} = await epub.readFile("toc")
console.log(data)
```

## async getFileInArchive(id)
Loads a file from the ebook as an object.
For *TS*: It implements the zip.Entry interface.

```js
let tocEntry = await epub.getFileInArchive("toc")
```

# Changes against [Julien-c's epub](https://github.com/julien-c/epub)

## Dependencies:
1. adm-zip | zipfile -> @zip.js/zip.js
2. xml2js -> xml-js

## Implementation:
1. Async-await based.
1. Uses built-in `DOM` parsers instead of `regex` for getting content.
1. **Flow** and **TOC** are instances of *Map* instead of being just an *Object*.