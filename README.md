

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
  //Can also use async functions
  async root() {
    console.log("Root found!")
  },
})
```


## V2 Major Change
* Julien's version included mandatory sanitization checks. While I added memoization in my version for my use case. Since V2 is now implemented in a functional way, those features has been moved to other functions for extensibility
1. MemoizedEpub - Caches succeeding [`getContent`](#async-getcontentchapter_id), and [`getImage`](#async-getimageimage_id) calls.
2. SanitizedEpub - Applies the ff:
  1. Removes inline js events
  2. Matches anchor tag srcs with the [flow](#flow)
  3. Matches media tag srcs with the [manifest](#manifest).
  4. If provided with the optional chapter transformer callback, the parsed data from #3 is passed to it.
3. MemoizedAndSanitizedEpub - Combines both MemoizedEpub and the SanitizedEpub features

* The raw data, as with the default behavior with [`epub`](#usage), 
  can still be retrieved by using the [`getContentRaw`](#async-getcontentrawchapter_id) method.
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
  //Note: key == chapter.id
    console.log(chapter.id)
})
```

Chapter `id` is needed to load the chapters with `getContent`

## toc
It is an instance of **TableOfContents** that extends **Map** whose values implement [Chapter](#chapter) . It is basically a slice of [Flow](#flow). It indicates a list of titles/urls for the TOC. Actual chapter(the file) is accessed with the `href` property.

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