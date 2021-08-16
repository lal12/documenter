# Documenter

Documenter is small but useful document management system, ideal for usage in your home network. You can search for keywords in all your documents, even scanned ones. It supports multiple file formats and uses OCR to convert images and scanned files to searchable PDFs.

## Features

- Add and manage documents
- Search for documents by content and meta data
- Supported file types: `pdf`, `txt`, `md`, `docx`, `xlsx`, `odt`, `ods`, `txt`
- Scanned documents are OCRed (file types: `pdf`, `png`, `jpg`)
- Download orignal documents and OCRed results
- Thumbnail of each file

## Installation

### Node.JS

**Requirements**

- NodeJS, NPM
- `antiword` or `textutil` on OS X for doc support
- `pdftotext` for PDF support
- `tesseract` for OCR support
- `unoconv`, and `imagemagick` for thumbnail preview
- tools to build node extensions (`gcc`, `gyp`, ...) OCR pre processing

**commands**

	# install
	npm install documenter 

Edit config.json and modify the paths if wished.

	# start
	node_modules/.bin/documenter 

### Docker (recommend)

Docker is the recommend method to install Documenter, since all the dependencies are bundled.

TODO!



## TODO

- Complete Attribute handling
- Finish replacement of REST with GraphQL
- Add tslint
- Add tests
- Create Docker image
- Add settings section on UI for language ...
- Add language setting on OCR-process

## Future Ideas
- Add user management + authentification
- Scan via button
- Write a daemon which listens for incoming scan (by pressing scan on the scanner)
- Add a document viewer on document page
- Do not ocr PDFs which already contain text
- Add batch operations to UI
- Add progress bar or some other indicator during OCR
- Add more filtering options on documents page
