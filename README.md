# Documenter
Documenter is a document management system. 

## Features

- Add and manage documents
- Add tags, date and custom attributes to each document
- Add custom attributes of several types (date, string, boolean, number)
- Search for documents by content and meta data
- Supported file types: `pdf`, `txt`, `md`, `docx`, `xlsx`, `odt`, `ods`, `txt`
- Scanned documents are OCRed (file types: `pdf`, `png`, `jpg`)
- Download orignal documents and OCRed results
- Thumbnail of each file

## Installation

### Node.JS

**Requirements**

- NodeJS, NPM
- MySQL or MariaDB
- `antiword` or `textutil` on OS X for doc support
- `pdftotext` for PDF support
- `tesseract` for OCR support
- `unoconv`, and `imagemagick` for thumbnail preview

**commands**

	# install
	npm install documenter 

Edit config.json and insert the SQL host, database and credentials.

	# start
	node_modules/.bin/documenter 

### Docker (recommend)

Docker is the recommend method to install Documenter, since all the dependencies are bundled.

TODO!