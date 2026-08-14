# Dev.to / Medium — Makale Başlıkları ve Özetleri

## Seçenek 1: Teknik Mimari

**Başlık:** How I Built a Full PDF + Word Editor with Electron and Next.js

**Özet:**
Building a desktop application that combines a word processor with PDF editing capabilities is no small feat. In this article, I walk through the architecture decisions, challenges (like avoiding the native `canvas` module in Electron), and how Tiptap, pdf-lib, pdfjs-dist, and Tesseract.js work together to create a seamless offline experience.

**İçerik iskeleti:**
1. Introduction — why build another PDF editor?
2. Architecture overview — Electron main/renderer, Next.js routing, Tiptap editor
3. Challenge 1: PDF canvas without native modules (pdfjsSetup.ts workaround)
4. Challenge 2: OCR in Electron (Tesseract.js + fake worker)
5. Challenge 3: Word import/export (docx templates with {{variables}})
6. Testing strategy — Vitest unit tests + Playwright E2E
7. Packaging with electron-builder (NSIS + Portable)
8. Conclusion and open-source invite

## Seçenek 2: Kullanıcı Odaklı

**Bašlik:** I Was Tired of Adobe Acrobat Subscriptions, So I Built a Free Alternative

**Özet:**
Every time I needed to merge two PDFs or add page numbers, I had to either pay for Acrobat or use an online tool that uploads my documents to someone else's server. So I built Scrivana — a free, open-source, offline PDF + Word editor. Here's what it can do and how you can use it.

## Seçenek 3: Hızlı Tanıtım

**Başlık:** Scrivana: A Free Offline PDF Editor in 300 Lines of Confidence

**Özet:**
Open-source, MIT licensed, runs on Windows. No account needed. Here's a 5-minute tour.
