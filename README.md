# My version achieves the same results but with better readability by leveraging modern JS techniques and features like the following:
1. Foreach loops
2. Async functions
3. Promises.

# Dependency change:
1. adm-zip | zipfile -> @zip.js/zip.js
2. xml2js -> xml-js

Note: I didn't need to change dependencies but my lack of knowledge of handling node packages caused me to do so (I'll explain in the future). 
I only realized my mistake when I was finished rewriting it so of course I will not do so again just to use the same libraries.


**NB!** Only ebooks in UTF-8 are currently supported!.

## Usage

```js
import Epub from '@jcsj/epub'
const epub = new Epub(file)
```

Where
  * **file** is an instance of the File class of an EPUB file.

  <details>
  <summary>
  Expand to read temporarily removed features.
  </summary>
  * **imageWebRoot** is the prefix for image URL's. If it's */images/* then the actual URL (inside img tags) is going to be */images/IMG_ID/IMG_FILENAME*, `IMG_ID` can be used to fetch the image form the ebook with `getImage`. Default: `/images/`
  * **chapterWebRoot** is the prefix for chapter URL's. If it's */chapter/* then the actual URL (inside chapter anchor tags) is going to be */chapters/CHAPTER_ID/CHAPTER_FILENAME*, `CHAPTER_ID` can be used to fetch the image form the ebook with `getChapter`. Default: `/links/`
  </details>

Before the contents of the ebook can be read, it must be opened (`Epub` is an `EventEmitter`).

```js
epub.on('loaded', function() {
  // epub is initialized now
  console.log(epub.metadata.title)

  var text = epub.getContent('chapter_id')
})

epub.open()
```

## metadata

Property of the *epub* object that holds several metadata fields about the book.

```js
epub.metadata
```

Available fields:

  * **creator** Author of the book (if multiple authors, will be seperated with '|') (*Lewis Carroll*)
  * **creatorFileAs** Author name on file (*Carroll, Lewis*)
  * **title** Title of the book (*Alice's Adventures in Wonderland*)
  * **language** Language code (*en* or *en-us* etc.)
  * **subject** Topic of the book (*Fantasy*)
  * **date** creation of the file (*2006-08-12*)
  * **description**

## flow

*flow* is a property of the *epub* object and holds the actual list of chapters (TOC is just an indication and can link to a # url inside a chapter file)

```js
epub.flow.forEach(chapter => {
    console.log(chapter.id)
})
```

Chapter `id` is needed to load the chapters with `getContent`

## toc
*toc* is a property of the *epub* object and indicates a list of titles/urls for the TOC. Actual chapter and it's ID needs to be detected with the `href` property

## async getChapter(chapter_id)

<details>
<summary>
Loads chapter text from the ebook and alters it. Additionally, the result is cached when an ID is first encountered.
</summary>
1. Keeps only body
1. Removes scripts, styles, and event handlers
1. Converts SVG IMG as a normal img tag.
1. Replaces the original image.src with the embedded base64.
</details>

```js
await epub.getContent('chapter1')
```

## async getContentRaw(chapter_id)

Load raw chapter text from the ebook.

## async getImage(image_id)
Load's image as a BLOB from the ebook. Additionally, the result is cached the first an ID is encountered.
```js
await epub.getImage('image1')
```

## async getFileContents(id, writer)
Loads a file's contents from the ebook as either TEXT or blob.

```js
const text = await epub.getFile("name")
```

## getFileInArchive(id)
Loads a file from the ebook as a Buffer.

```js
epub.getFile("name")
```