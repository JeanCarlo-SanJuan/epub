# My version achieves the same results but with better readability by leveraging modern JS techniques and features like the following:
1. Foreach loop
2. Async functions
3. Promises.

# Dependency change:
1. adm-zip | zipfile -> @zip.js/zip.js
2. xml2js -> xml-js

Note: I didn't need to change dependencies but my lack of knowledge of handling node packages caused me to do so (I'll explain in the future). 
I only realized my mistake when I was finished rewriting it so of course I will not do so again just to use the same libraries.


**NB!** Only ebooks in UTF-8 are currently supported!.

# TODO: Upload to NPM

# WARNING: OUTDATED DOCUMENTATION #
## Usage

```js
import EPub from 'epub'
const epub = new EPub(pathToFile, imageWebRoot, chapterWebRoot)
```

Where

  * **pathToFile** is the file path to an EPUB file
  * **imageWebRoot** is the prefix for image URL's. If it's */images/* then the actual URL (inside chapter HTML `<img>` blocks) is going to be */images/IMG_ID/IMG_FILENAME*, `IMG_ID` can be used to fetch the image form the ebook with `getImage`. Default: `/images/`
  * **chapterWebRoot** is the prefix for chapter URL's. If it's */chapter/* then the actual URL (inside chapter HTML `<a>` links) is going to be */chapters/CHAPTER_ID/CHAPTER_FILENAME*, `CHAPTER_ID` can be used to fetch the image form the ebook with `getChapter`. Default: `/links/`
 
Before the contents of the ebook can be read, it must be opened (`EPub` is an `EventEmitter`).

```js
epub.on('end', function() {
  // epub is initialized now
  console.log(epub.metadata.title)

  epub.getChapter('chapter_id', (err, text) => {})
})

epub.parse()
```

## metadata

Property of the *epub* object that holds several metadata fields about the book.

```js
epub.metadata
```

Available fields:

  * **creator** Author of the book (if multiple authors, then the first on the list) (*Lewis Carroll*)
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

Chapter `id` is needed to load the chapters `getChapter`

## toc
*toc* is a property of the *epub* object and indicates a list of titles/urls for the TOC. Actual chapter and it's ID needs to be detected with the `href` property


## getChapter(chapter_id, callback)

Load chapter text from the ebook.

```js
epub.getChapter('chapter1', (error, text) => {})
```

## getChapterRaw(chapter_id, callback)

Load raw chapter text from the ebook.

## getImage(image_id, callback)

Load image (as a Buffer value) from the ebook.

```js
epub.getImage('image1', (error, img, mimeType) => {})
```

## getFile(file_id, callback)

Load any file (as a Buffer value) from the ebook.

```js
epub.getFile('css1', (error, data, mimeType) => {})
```
