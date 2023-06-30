
**NB!** Only ebooks in UTF-8 are currently supported!.

## Usage 
* Ready an instance of [File](https://developer.mozilla.org/en-US/docs/Web/API/File) or `Blob` containing the epub data then pass it to the following `epub` function or its variants.
```ts
import epub from '@jcsj/epub'
// Inside an async block 
async function load() {
  const epub = await epub(file);
  //...
}

//Or with a promise
epub(file).then(epub => {
  //...
})

//Use the 2nd arg to handle parser progress events
epub(file, {
  metadata(metadata) {
    console.log("Meta:", metadata);
    //Set the tab's title with the book's title.
    document.title = metadata.title;
  },
  manifest(manifest) {
      console.log("Manifest: ", manifest);
  },
  spine(spine) {
    console.log("Spine:", spine);
  },
  flow(flow) {
    console.log("Flow: ", flow);
  },
  toc(toc) {
    console.log("TOC: ", toc);
  }
  //Can also be async
  async root() {
    console.log("Root found!")
  },
})
```

## V2 Major Change
* Julien's version included mandatory sanitization checks. While I added memoization in my version for my use case. Since V2 is now implemented in a functional way, those features has been moved to other functions for extensibility
1. [MemoizedEpub](#memoizedepub).
2. [SanitizedEpub](#sanitizedepub)
3. [MemoizedAndSanitizedEpub](#memoizedandsanitizedepub) - Combines both MemoizedEpub and the SanitizedEpub features

* The variants have [`getContentRaw`](#async-getcontentrawchapter_id), to call the original [getcontent](#async-getcontentchapterid)
```js
import { MemoizedEpub, SanitizedEpub, MemoizedEpubAndSanitized } from "@jcsj/epub"

//Same usage as `epub`
MemoizedEpub(file,{
  metadata(metadata) {
    //...
  }
}).then(memoizedEpub => {
  //...
}) 
```

## DEPRECATED: 
### async getFileInArchive(id)
### async readFile(id, writer="text")
1. **data** - string.
* the writer determines the data's string representation:
  1. "text" for chapter data in utf-8.
  2. "image" for base64 string of an image.
### Use Reader.read instead
* These has been simplified into Reader.read, 
* but was moved out of epub as I found it to be rarely used in that form.
```ts    
const toc:LoadedEntry = await epub.parser.reader.read("toc")
console.log(toc.data)
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

An instance of Flow class which is a Map whose values implement [Item](#item). It's a slice of [manifest](#manifest). The values hold the actual list of chapters (TOC is just an indication and can link to a # url inside a chapter file).

```js
epub.flow.forEach([key, value] => {
    console.log(key, value)
})
```

Chapter `id` is needed to load the chapters with `getContent`

## toc
It is an instance of **TableOfContents** that extends **Map** whose values implement [Chapter](#chapter) . It is basically a slice of [Flow](#flow). It indicates a list of titles/urls for the TOC. Actual chapter(the file) is accessed with the `href` property.

## Chapter
An extension of **Item** with the following additional properties:
1. **order** - int
2. **title** - string

## async getContent(chapterId)

Loads chapter text from the ebook as a promise.

```js
let text = await epub.getContent('chapter1')
```

## async getImage(imageId)
* Load's image as a base64 string from the ebook. 
* This can be used as the src of an HTML img element.
* use MemoizedEpub for caching.
### Usage
```js
const coverImage = await epub.getImage('cover');
const imageElement = document.createElement("img")
imageElement.src = coverImage
document.body.appendChild(imageElement)
```
## MemoizedEpub
## async getImage(imageId)
### async getContent(chapterId)
### async getContentRaw(chapterId)
## SanitizedEpub
### async getContent(chapterId)
* Load raw chapter text from the ebook. It is altered to be web safe
1. Keeps only the body tag.
2. Removes scripts, styles, and event handlers
3. Converts SVG IMG as a normal img tag.
4. Replaces the original image.src with the embedded base64.
5. Previous src is saved in dataset.src.
### async getContentRaw(chapterId)

## MemoizedAndSanitizedEpub
## async getImage(imageId)
### async getContent(chapterId)
### async getContentRaw(chapterId)

## Composability
* Create your custom implemention of epub by calling [epub](#usage) then overwriting and adding methods/properties to resulting epub interface. For examples, see the implementation of [MemoizedEpub](#v2-major-change) and its variants.
* For more fine grained control or writing your own parser, the functions used in [epub](./lib/index.ts) most internally used functions are exported.
# Changes against [Julien-c's epub](https://github.com/julien-c/epub)

## Dependencies:
1. adm-zip | zipfile -> @zip.js/zip.js
2. xml2js -> xml-js -> @jcsj/xml-js (as of V2)


## Implementation:
1. Async-await based.
1. Uses built-in `DOM` parsers instead of `regex` for getting content.
1. **Flow** and **TOC** are instances of *Map* instead of being just an *Object*.
1. Use functions and TS interfaces instead of a class
