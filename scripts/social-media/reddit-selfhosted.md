# Reddit — r/selfhosted

**Başlık:** Scrivana: Free & open-source PDF + Word editor that runs 100% offline (Electron + Next.js)

**İçerik:**

I built Scrivana — a desktop PDF + Word editor that runs entirely offline. No subscriptions, no cloud, no telemetry.

**What it does:**
- Full rich-text editor (bold, italic, tables, images, links, headers, footers)
- PDF tools: merge, split, compress, watermark, page numbers, headers/footers, encryption
- PDF editor: reorder, delete, rotate pages, add text/highlights directly on PDF pages
- OCR with Tesseract.js (English + Turkish built-in)
- Word (.docx) import/export with template variable support
- PDF visual import (each page as an image in the editor)
- Dark/light theme, command palette (Ctrl+K), page thumbnails

**Tech stack:** Electron 33 + Next.js 15 + React + TypeScript + Tiptap + pdf-lib + pdfjs-dist + Tesseract.js

**Why:** Tired of Adobe Acrobat subscriptions and online PDF tools that upload your documents to their servers. Everything in Scrivana runs locally on your machine.

It's free, open-source, and available on GitHub: https://github.com/furykingisback/scrivana

Windows installer and portable builds available. Linux/macOS builds welcome as PRs.

Would love feedback from the self-hosted community!
