import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { FileChild } from 'docx';
import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  PDFName,
  PDFStream,
  PDFArray,
  PDFContentStream,
  PDFRawStream,
  PDFDict,
  PDFPage,
  PDFImage,
  decodePDFRawStream,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFSignature,
} from 'pdf-lib-with-encrypt';
import './pdfjsSetup';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import { createPdfCanvasFactory } from './pdfjsSetup';
import * as fontkit from '@pdf-lib/fontkit';

function resolveFontDir(): string {
  const candidates = [
    path.join(__dirname, 'assets', 'fonts'),
    path.join(__dirname, '..', 'assets', 'fonts'),
    path.join(process.resourcesPath || '', 'assets', 'fonts'),
  ];
  for (const p of candidates) {
    try {
      if (fs.statSync(p).isDirectory()) return p;
    } catch {
      /* yut */
    }
  }
  return candidates[0];
}

function resolveOcrDir(): string {
  const candidates = [
    path.join(__dirname, 'assets', 'ocr'),
    path.join(__dirname, '..', 'assets', 'ocr'),
    path.join(process.resourcesPath || '', 'assets', 'ocr'),
  ];
  for (const p of candidates) {
    try {
      if (fs.statSync(p).isDirectory()) return p;
    } catch {
      /* yut */
    }
  }
  return candidates[0];
}

function registerFontkit(doc: PDFDocument): void {
  (doc as unknown as { registerFontkit: (fk: unknown) => void }).registerFontkit(fontkit);
}

async function embedTurkishFont(doc: PDFDocument, name: string): Promise<import('pdf-lib-with-encrypt').PDFFont> {
  const file = path.join(resolveFontDir(), name);
  try {
    const bytes = await fs.promises.readFile(file);
    registerFontkit(doc);
    return await doc.embedFont(bytes);
  } catch {
    return doc.embedFont(StandardFonts.Helvetica);
  }
}

export type PdfTaskName =
  | 'pdfPageCount'
  | 'extractPdfText'
  | 'mergePdfs'
  | 'splitPdf'
  | 'encryptPdf'
  | 'decryptPdf'
  | 'watermarkPdf'
  | 'pdfToWord'
  | 'pdfRebuildPdf'
  | 'pdfEditText'
  | 'pdfRedact'
  | 'pdfOcr'
  | 'pdfCompress'
  | 'pdfPageNumbers'
  | 'pdfHeaderFooter'
  | 'pdfOrganize'
  | 'pdfPageSize'
  | 'pdfBackground'
  | 'pdfListFormFields'
  | 'pdfFillForm'
  | 'pdfSign'
  | 'pdfExportImages'
  | 'imagesToPdf'
  | 'pdfGetMetadata'
  | 'pdfSetMetadata'
  | 'pdfBatesNumbering'
  | 'pdfPermissions'
  | 'pdfAddFormField'
  | 'pdfAttachFile'
  | 'pdfSetBookmarks'
  | 'pdfSmartImportText'
  | 'pdfImportAsVisualHtml'
  | 'readFileBase64';

export interface PdfOperationResult {
  ok: boolean;
  message: string;
  output?: string;
  outputs?: string[];
}

export interface PdfAnnotationSpec {
  type: 'text' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  color?: string;
}

export interface PdfPageSpec {
  file: number;
  page: number;
  rotation?: number;
  annotations?: PdfAnnotationSpec[];
}

export interface PdfTextEditSpec {
  page: number;
  x: number;
  baseline: number;
  width: number;
  height: number;
  text: string;
  fontSize?: number;
  color?: string;
}

export interface PdfRedactSpec {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfOrganizeOptions {
  order?: number[];
  rotate?: Record<string, number>;
}

export interface PdfPageSizeOptions {
  preset?: string;
  widthPt?: number;
  heightPt?: number;
}

export interface PdfBackgroundOptions {
  color?: string;
  opacity?: number;
  imagePath?: string;
}

export interface PdfFormFieldInfo {
  name: string;
  type: string;
  value?: string;
  options?: string[];
  readOnly: boolean;
}

export interface PdfFillFormOptions {
  values?: Record<string, string>;
  flatten?: boolean;
}

export type SignPosition = 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right';

export interface PdfSignOptions {
  page?: number;
  position?: SignPosition;
  text?: string;
  imagePath?: string;
  fontSize?: number;
  color?: string;
  maxWidth?: number;
  margin?: number;
}

export interface PdfExportImagesOptions {
  format?: 'png' | 'jpeg';
  scale?: number;
}

export interface ImagesToPdfOptions {
  fitToPage?: boolean;
}

export interface PdfMetadataInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

export interface PdfBatesNumberingOptions {
  prefix?: string;
  start?: number;
  digits?: number;
  position?: SignPosition;
  fontSize?: number;
  color?: string;
  margin?: number;
}

export interface PdfPermissionsOptions {
  userPassword?: string;
  ownerPassword?: string;
  printing?: 'low' | 'high' | 'none';
  modifying?: boolean;
  copying?: boolean;
  annotating?: boolean;
  documentAssembly?: boolean;
}

export interface PdfAddFormFieldOptions {
  page?: number;
  type?: 'text' | 'checkbox' | 'dropdown';
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  defaultValue?: string;
  options?: string[];
}

export interface PdfAttachFileOptions {
  filePath?: string;
  description?: string;
}

export interface PdfBookmarkSpec {
  title: string;
  page: number;
}

export const PAGE_SIZES_PT: Record<string, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
  A5: { width: 419.53, height: 595.28 },
};

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let h = (hex || '#000000').replace('#', '').trim();
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
  const n = parseInt(h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function parsePageRanges(ranges: string[]): number[][] {  const groups: number[][] = [];
  for (const range of ranges) {
    const group: number[] = [];
    for (const seg of range.split(',')) {
      const m = seg.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        for (let i = Math.min(a, b); i <= Math.max(a, b); i += 1) group.push(i);
      } else {
        const s = seg.trim().match(/^(\d+)$/);
        if (s) group.push(parseInt(s[1], 10));
      }
    }
    if (group.length) groups.push(group);
  }
  return groups;
}

export async function pdfPageCount(filePath: string): Promise<number> {
  const data = new Uint8Array(await fs.promises.readFile(filePath));
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function extractPdfText(
  filePath: string,
): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }> {
  try {
    const data = new Uint8Array(await fs.promises.readFile(filePath));
    const init = {
      data,
      isEvalSupported: false,
      useSystemFonts: true,
      disableWorker: true,
      disableFontFace: true,
    } as Parameters<typeof pdfjs.getDocument>[0];
    const task = pdfjs.getDocument(init);
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let text = '';
      for (const item of content.items) {
        if ('str' in item && typeof item.str === 'string') {
          text += item.str;
          text += 'hasEOL' in item && item.hasEOL ? '\n' : ' ';
        }
      }
      pages.push(text);
    }
    const numPages = pdf.numPages;
    await pdf.destroy();
    return { ok: true, message: `${numPages} sayfa çıkarıldı.`, pages, numPages };
  } catch (err) {
    return { ok: false, message: `PDF okunamadı: ${errorMessage(err)}` };
  }
}

export async function pdfSmartImportText(
  filePath: string,
): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }> {
  const res = await extractPdfText(filePath);
  const totalChars = res.pages ? res.pages.reduce((acc, p) => acc + p.trim().length, 0) : 0;
  if (res.ok && totalChars > 20) {
    return res;
  }
  try {
    const tmpOut = path.join(os.tmpdir(), `ak-smart-ocr-${Date.now()}.pdf`);
    const ocrRes = await pdfOcr(filePath, tmpOut, { language: 'tur+eng' });
    if (ocrRes.ok) {
      const ocrBytes = new Uint8Array(await fs.promises.readFile(tmpOut));
      const ocrInit = {
        data: ocrBytes,
        isEvalSupported: false,
        useSystemFonts: true,
        disableFontFace: true,
      } as Parameters<typeof pdfjs.getDocument>[0];
      const ocrTask = pdfjs.getDocument(ocrInit);
      const ocrPdf = await ocrTask.promise;
      const ocrPages: string[] = [];
      for (let i = 1; i <= ocrPdf.numPages; i += 1) {
        const page = await ocrPdf.getPage(i);
        const content = await page.getTextContent();
        let text = '';
        for (const item of content.items) {
          if ('str' in item && typeof item.str === 'string') {
            text += item.str;
            text += 'hasEOL' in item && item.hasEOL ? '\n' : ' ';
          }
        }
        ocrPages.push(text);
      }
      const ocrNumPages = ocrPdf.numPages;
      await ocrPdf.destroy();
      await fs.promises.unlink(tmpOut).catch(() => {});
      return { ok: true, message: `${ocrNumPages} sayfa akıllı OCR ile içe aktarıldı.`, pages: ocrPages, numPages: ocrNumPages };
    }
    await fs.promises.unlink(tmpOut).catch(() => {});
  } catch {
    /* yut */
  }
  return res;
}

export async function mergePdfs(paths: string[], outPath: string): Promise<PdfOperationResult> {
  try {
    const merged = await PDFDocument.create();
    for (const p of paths) {
      const bytes = await fs.promises.readFile(p);
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      for (const page of pages) merged.addPage(page);
    }
    await fs.promises.writeFile(outPath, await merged.save());
    return { ok: true, message: `${paths.length} dosya birleştirildi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Birleştirme hatası: ${errorMessage(err)}` };
  }
}

export async function splitPdf(inPath: string, ranges: string[], outDir: string): Promise<PdfOperationResult> {
  try {
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    const groups = parsePageRanges(ranges);
    if (!groups.length) return { ok: false, message: 'Geçerli sayfa aralığı girilmedi.' };
    const outputs: string[] = [];
    let index = 0;
    for (const group of groups) {
      const valid = group.filter((p) => p >= 1 && p <= total);
      if (!valid.length) continue;
      index += 1;
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, valid.map((p) => p - 1));
      for (const page of pages) doc.addPage(page);
      const label = `${valid[0]}${valid.length > 1 ? `-${valid[valid.length - 1]}` : ''}`;
      const outPath = path.join(outDir, `part-${index}-sayfa-${label}.pdf`);
      await fs.promises.writeFile(outPath, await doc.save());
      outputs.push(outPath);
    }
    if (!outputs.length) return { ok: false, message: 'Seçilen sayfalar sınırlar dışında.' };
    return { ok: true, message: `${outputs.length} dosyaya bölündü.`, outputs };
  } catch (err) {
    return { ok: false, message: `Bölme hatası: ${errorMessage(err)}` };
  }
}

export async function encryptPdf(inPath: string, outPath: string, password: string): Promise<PdfOperationResult> {
  try {
    if (!password) return { ok: false, message: 'Şifre boş olamaz.' };
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    await src.encrypt({ userPassword: password, ownerPassword: password });
    await fs.promises.writeFile(outPath, await src.save());
    return { ok: true, message: 'PDF şifreyle korundu.', output: outPath };
  } catch (err) {
    return { ok: false, message: `Şifreleme hatası: ${errorMessage(err)}` };
  }
}

export async function decryptPdf(inPath: string, outPath: string, password: string): Promise<PdfOperationResult> {
  try {
    if (!password) return { ok: false, message: 'Şifre boş olamaz.' };
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { password });
    await fs.promises.writeFile(outPath, await src.save());
    return { ok: true, message: 'Şifre kaldırıldı.', output: outPath };
  } catch (err) {
    return { ok: false, message: `Şifre kaldırılamadı (yanlış şifre olabilir): ${errorMessage(err)}` };
  }
}

export async function watermarkPdf(
  inPath: string,
  outPath: string,
  opts: { text: string; fontSize: number; opacity: number; color: string; rotate: number; repeat: boolean },
): Promise<PdfOperationResult> {
  try {
    const text = (opts.text || 'GİZLİ').trim() || 'GIZLI';
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await embedTurkishFont(src, 'LiberationSans-Bold.ttf');
    const { r, g, b } = parseHexColor(opts.color || '#808080');
    const size = Math.max(8, Math.min(96, opts.fontSize || 48));
    const opacity = Math.max(0.05, Math.min(1, opts.opacity || 0.25));
    const rotate = opts.rotate ?? 45;

    for (const page of src.getPages()) {
      const { width, height } = page.getSize();
      if (opts.repeat) {
        const stepX = Math.max(width / 2, 160);
        const stepY = Math.max(height / 2, 160);
        let x = stepX / 2;
        while (x < width) {
          let y = stepY / 2;
          while (y < height) {
            page.drawText(text, {
              x,
              y,
              size,
              font,
              color: rgb(r, g, b),
              opacity,
              rotate: degrees(rotate),
            });
            y += stepY;
          }
          x += stepX;
        }
      } else {
        page.drawText(text, {
          x: width / 2,
          y: height / 2,
          size,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(rotate),
        });
      }
    }
    await fs.promises.writeFile(outPath, await src.save());
    return { ok: true, message: 'Filigran başarıyla uygulandı.', output: outPath };
  } catch (err) {
    return { ok: false, message: `Filigran hatası: ${errorMessage(err)}` };
  }
}

export function transliterate(text: string): string {
  return text
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

export async function readFileBase64(filePath: string): Promise<{ ok: boolean; base64?: string; message?: string }> {
  try {
    const data = await fs.promises.readFile(filePath);
    return { ok: true, base64: data.toString('base64') };
  } catch (err) {
    return { ok: false, message: `Dosya okunamadı: ${errorMessage(err)}` };
  }
}

export async function pdfRebuildPdf(
  inputs: string[],
  outPath: string,
  pages: PdfPageSpec[],
): Promise<PdfOperationResult> {
  try {
    if (!inputs.length || !pages.length) return { ok: false, message: 'Sayfa listesi boş.' };
    const docs: PDFDocument[] = [];
    for (const p of inputs) {
      const bytes = await fs.promises.readFile(p);
      docs.push(await PDFDocument.load(bytes, { ignoreEncryption: true }));
    }
    const out = await PDFDocument.create();
    const font = await embedTurkishFont(out, 'LiberationSans-Regular.ttf');
    const fontBold = await embedTurkishFont(out, 'LiberationSans-Bold.ttf');

    for (const spec of pages) {
      const src = docs[spec.file];
      if (!src) return { ok: false, message: 'Kaynak dosya bulunamadı.' };
      const idx = spec.page - 1;
      if (idx < 0 || idx >= src.getPageCount()) return { ok: false, message: `Sayfa ${spec.page} sınırlar dışında.` };
      const [copied] = await out.copyPages(src, [idx]);
      const rotation = ((spec.rotation ?? 0) % 360 + 360) % 360;
      if (rotation) copied.setRotation(degrees(rotation));
      out.addPage(copied);

      const { height } = copied.getSize();
      for (const ann of spec.annotations ?? []) {
        const w = Math.max(1, ann.width);
        const h = Math.max(1, ann.height);
        const pdfY = height - ann.y - h;
        if (ann.type === 'highlight') {
          const { r, g, b } = parseHexColor(ann.color || '#FFEB3B');
          copied.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: w,
            height: h,
            color: rgb(r, g, b),
            opacity: 0.35,
          });
        } else {
          const text = (ann.text ?? '').trim();
          if (text) {
            const size = Math.max(6, Math.min(72, ann.fontSize || 12));
            const { r, g, b } = parseHexColor(ann.color || '#111827');
            const drawOpts = {
              x: ann.x + 2,
              y: height - ann.y - size,
              size,
              font: size > 18 ? fontBold : font,
              color: rgb(r, g, b),
            };
            copied.drawText(text, drawOpts);
          }
        }
      }
    }
    await fs.promises.writeFile(outPath, await out.save());
    return { ok: true, message: `${pages.length} sayfa yazıldı.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `PDF düzenleme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfEditText(inPath: string, outPath: string, edits: PdfTextEditSpec[]): Promise<PdfOperationResult> {
  try {
    if (!edits.length) return { ok: false, message: 'Düzenlenecek metin yok.' };
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await embedTurkishFont(src, 'LiberationSans-Regular.ttf');
    for (const e of edits) {
      const idx = e.page - 1;
      if (idx < 0 || idx >= src.getPageCount()) return { ok: false, message: `Sayfa ${e.page} sınırlar dışında.` };
      const page = src.getPage(idx);
      const w = Math.max(2, e.width);
      const h = Math.max(4, e.height);
      page.drawRectangle({ x: e.x - 1, y: e.baseline - h - 1, width: w + 2, height: h + 2, color: rgb(1, 1, 1) });
      const text = (e.text ?? '').trim();
      if (text) {
        const size = Math.max(6, Math.min(72, e.fontSize || h * 0.75));
        const { r, g, b } = parseHexColor(e.color || '#000000');
        page.drawText(text, { x: e.x, y: e.baseline, size, font, color: rgb(r, g, b) });
      }
    }
    await fs.promises.writeFile(outPath, await src.save());
    return { ok: true, message: `${edits.length} metin düzenlendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Metin düzenleme hatası: ${errorMessage(err)}` };
  }
}

// ---- Redaction: content-stream metin silme ----

interface Token {
  type: 'operand' | 'operator';
  kind: string;
  value: unknown;
  raw: string;
}

function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = content.length;
  const isWs = (c: string) => c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '\f' || c === '\0';
  const isDelim = (c: string) => c === '[' || c === ']' || c === '<' || c === '>' || c === '/' || c === '(' || c === ')' || c === '%';
  const isNumStart = (c: string) => c === '+' || c === '-' || c === '.' || (c >= '0' && c <= '9');

  while (i < len) {
    const c = content[i];
    if (isWs(c)) {
      i += 1;
      continue;
    }
    if (c === '%') {
      while (i < len && content[i] !== '\n' && content[i] !== '\r') i += 1;
      continue;
    }
    if (c === '(') {
      let depth = 0;
      let j = i;
      let raw = '';
      while (j < len) {
        const ch = content[j];
        raw += ch;
        if (ch === '\\') {
          raw += content[j + 1] ?? '';
          j += 2;
          continue;
        }
        if (ch === '(') depth += 1;
        else if (ch === ')') {
          depth -= 1;
          if (depth === 0) {
            j += 1;
            break;
          }
        }
        j += 1;
      }
      tokens.push({ type: 'operand', kind: 'string', value: raw, raw });
      i = j;
      continue;
    }
    if (c === '<' && content[i + 1] === '<') {
      let j = i + 2;
      while (j < len && !(content[j] === '>' && content[j + 1] === '>')) j += 1;
      j = Math.min(j + 2, len);
      const raw = content.slice(i, j);
      tokens.push({ type: 'operand', kind: 'dict', value: raw, raw });
      i = j;
      continue;
    }
    if (c === '<') {
      let j = i + 1;
      while (j < len && content[j] !== '>') j += 1;
      j = Math.min(j + 1, len);
      const raw = content.slice(i, j);
      tokens.push({ type: 'operand', kind: 'hex', value: raw, raw });
      i = j;
      continue;
    }
    if (c === '[') {
      let depth = 0;
      let j = i;
      while (j < len) {
        if (content[j] === '[') depth += 1;
        else if (content[j] === ']') {
          depth -= 1;
          if (depth === 0) {
            j += 1;
            break;
          }
        }
        j += 1;
      }
      const raw = content.slice(i, j);
      tokens.push({ type: 'operand', kind: 'array', value: raw, raw });
      i = j;
      continue;
    }
    if (c === '/') {
      let j = i + 1;
      while (j < len && !isWs(content[j]) && !isDelim(content[j])) j += 1;
      const raw = content.slice(i, j);
      tokens.push({ type: 'operand', kind: 'name', value: raw, raw });
      i = j;
      continue;
    }
    if (isNumStart(c) || !isDelim(c)) {
      let j = i;
      while (j < len && !isWs(content[j]) && !isDelim(content[j])) j += 1;
      const raw = content.slice(i, j);
      if (raw && isNumStart(raw[0]) && !/^[a-zA-Z]/.test(raw)) {
        tokens.push({ type: 'operand', kind: 'number', value: parseFloat(raw), raw });
      } else if (raw) {
        tokens.push({ type: 'operator', kind: 'op', value: raw, raw });
      } else {
        i += 1;
        continue;
      }
      i = j;
      continue;
    }
    i += 1;
  }
  return tokens;
}

const ID_MATRIX: number[] = [1, 0, 0, 1, 0, 0];

function mulMatrix(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
}

function translateMatrix(tx: number, ty: number): number[] {
  return [1, 0, 0, 1, tx, ty];
}

function fmtNum(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}

function approxTextWidth(str: string, fontSize: number): number {
  const cleaned = str.replace(/\\([\\()])/g, '$1');
  return cleaned.length * fontSize * 0.6;
}

function operandText(operand: Token): string {
  if (operand.kind === 'string') {
    return operand.raw.replace(/^\(/, '').replace(/\)$/, '').replace(/\\([\\()])/g, '$1');
  }
  if (operand.kind === 'hex') {
    const hex = operand.raw.replace(/^</, '').replace(/>$/, '').replace(/\s+/g, '');
    if (hex.length % 2 !== 0) return hex;
    let out = '';
    for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    return out;
  }
  return '';
}

interface RedactRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function intersects(a: RedactRect, b: RedactRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function redactContentStream(content: string, pageHeight: number, rects: RedactRect[]): { content: string; removed: number } {
  const tokens = tokenizeContent(content);
  const out: string[] = [];
  let removed = 0;
  const ctmStack: number[][] = [[...ID_MATRIX]];
  let ctm = ctmStack[0];
  let inText = false;
  let fontSize = 12;
  let tm = [...ID_MATRIX];
  let tlm = [...ID_MATRIX];
  let leading = 0;
  const pending: Token[] = [];

  const emit = (t: Token) => out.push(t.raw);

  const showString = (strRaw: string, op: string, operands: Token[]) => {
    const strOperand = operands[operands.length - 1];
    const strContent = operandText(strOperand);
    const width = approxTextWidth(strContent, fontSize);
    const cur = mulMatrix(ctm, tm);
    const e = cur[4];
    const f = cur[5];
    const a = cur[0];
    const endX = e + a * width;
    const yMax = Math.max(f, f);
    const tx = Math.min(e, endX);
    const tw = Math.abs(endX - e);
    const th = fontSize;
    const ty = pageHeight - (yMax + fontSize);
    const textBox: RedactRect = { x: tx, y: ty, width: Math.max(tw, 1), height: Math.max(th, 1) };
    const hit = rects.some((r) => intersects(r, textBox));
    if (hit) {
      removed += 1;
      for (const t of operands) emit(t);
      const nextTm = mulMatrix(translateMatrix(width, 0), tm);
      out.push(`${fmtNum(nextTm[0])} ${fmtNum(nextTm[1])} ${fmtNum(nextTm[2])} ${fmtNum(nextTm[3])} ${fmtNum(nextTm[4])} ${fmtNum(nextTm[5])} Tm`);
      tm = nextTm;
      return;
    }
    for (const t of operands) emit(t);
    emit({ type: 'operator', kind: 'op', value: op, raw: op });
    tm = mulMatrix(translateMatrix(width, 0), tm);
  };

  for (const t of tokens) {
    if (t.type === 'operand') {
      pending.push(t);
      continue;
    }
    const op = String(t.value);
    const operands = pending.slice();
    pending.length = 0;

    const nums = operands.filter((o) => o.kind === 'number').map((o) => o.value as number);

    switch (op) {
      case 'q': {
        ctmStack.push([...ctm]);
        out.push(op);
        break;
      }
      case 'Q': {
        if (ctmStack.length > 1) ctmStack.pop();
        ctm = ctmStack[ctmStack.length - 1];
        out.push(op);
        break;
      }
      case 'cm': {
        if (nums.length >= 6) {
          const m = [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]];
          ctm = mulMatrix(ctm, m);
        }
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
      case 'BT': {
        inText = true;
        tm = [...ID_MATRIX];
        tlm = [...ID_MATRIX];
        fontSize = 12;
        out.push(op);
        break;
      }
      case 'ET': {
        inText = false;
        out.push(op);
        break;
      }
      case 'Tf': {
        const size = nums[nums.length - 1];
        if (Number.isFinite(size)) fontSize = size;
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
      case 'Td':
      case 'TD': {
        const tx = nums[nums.length - 2] ?? 0;
        const ty = nums[nums.length - 1] ?? 0;
        tlm = mulMatrix(translateMatrix(tx, ty), tlm);
        tm = tlm;
        if (op === 'TD') leading = -ty;
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
      case 'T*': {
        tlm = mulMatrix(translateMatrix(0, -leading), tlm);
        tm = tlm;
        out.push(op);
        break;
      }
      case 'Tm': {
        if (nums.length >= 6) {
          tm = [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]];
          tlm = tm;
        }
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
      case 'TL': {
        const l = nums[nums.length - 1];
        if (Number.isFinite(l)) leading = l;
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
      case 'Tj': {
        const str = operands[operands.length - 1];
        if (str && (str.kind === 'string' || str.kind === 'hex')) showString(str.raw, op, operands);
        else {
          for (const o of operands) emit(o);
          out.push(op);
        }
        break;
      }
      case 'TJ': {
        const arr = operands[operands.length - 1];
        if (arr && arr.kind === 'array') {
          const inner = arr.raw.replace(/^\[/, '').replace(/\]$/, '');
          const str = inner.replace(/<[0-9A-Fa-f\s]*>|\([^)]*\)/g, 'x').replace(/[-.\d]+/g, '');
          const width = str.length * fontSize * 0.6;
          const cur = mulMatrix(ctm, tm);
          const e = cur[4];
          const a = cur[0];
          const endX = e + a * width;
          const tx = Math.min(e, endX);
          const tw = Math.abs(endX - e);
          const ty = pageHeight - (cur[5] + fontSize);
          const textBox: RedactRect = { x: tx, y: ty, width: Math.max(tw, 1), height: Math.max(fontSize, 1) };
          const hit = rects.some((r) => intersects(r, textBox));
          if (hit) {
            removed += 1;
            for (const o of operands) emit(o);
            const nextTm = mulMatrix(translateMatrix(width, 0), tm);
            out.push(`${fmtNum(nextTm[0])} ${fmtNum(nextTm[1])} ${fmtNum(nextTm[2])} ${fmtNum(nextTm[3])} ${fmtNum(nextTm[4])} ${fmtNum(nextTm[5])} Tm`);
            tm = nextTm;
          } else {
            for (const o of operands) emit(o);
            out.push(op);
            tm = mulMatrix(translateMatrix(width, 0), tm);
          }
        } else {
          for (const o of operands) emit(o);
          out.push(op);
        }
        break;
      }
      case "'": {
        const str = operands[operands.length - 1];
        tlm = mulMatrix(translateMatrix(0, -leading), tlm);
        tm = tlm;
        if (str && (str.kind === 'string' || str.kind === 'hex')) showString(str.raw, op, operands);
        else {
          for (const o of operands) emit(o);
          out.push(op);
        }
        break;
      }
      case '"': {
        const str = operands[operands.length - 1];
        tlm = mulMatrix(translateMatrix(0, -leading), tlm);
        tm = tlm;
        if (str && (str.kind === 'string' || str.kind === 'hex')) showString(str.raw, op, operands);
        else {
          for (const o of operands) emit(o);
          out.push(op);
        }
        break;
      }
      default: {
        for (const o of operands) emit(o);
        out.push(op);
        break;
      }
    }
  }
  return { content: out.join('\n'), removed };
}

export async function pdfRedact(inPath: string, outPath: string, redactions: PdfRedactSpec[]): Promise<PdfOperationResult> {
  try {
    if (!redactions.length) return { ok: false, message: 'Redakte edilecek alan yok.' };
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const byPage = new Map<number, RedactRect[]>();
    for (const r of redactions) {
      const idx = r.page - 1;
      if (idx < 0 || idx >= doc.getPageCount()) return { ok: false, message: `Sayfa ${r.page} sınırlar dışında.` };
      const list = byPage.get(idx) || [];
      list.push({ x: r.x, y: r.y, width: Math.max(1, r.width), height: Math.max(1, r.height) });
      byPage.set(idx, list);
    }
    let totalRemoved = 0;
    for (const [idx, rects] of byPage.entries()) {
      const page = doc.getPage(idx);
      page.node.normalize();
      const { height } = page.getSize();
      let combined = '';
      const contents = page.node.Contents();
      const readStream = (ref: unknown): string => {
        const stream = doc.context.lookup(ref as never, PDFStream);
        if (!stream) return '';
        if (stream instanceof PDFContentStream) {
          return stream.getContentsString();
        }
        try {
          const bytes = decodePDFRawStream(stream as unknown as never).decode();
          return Buffer.from(bytes).toString('latin1');
        } catch {
          return stream.getContentsString();
        }
      };
      if (contents instanceof PDFArray) {
        for (const ref of contents.asArray()) {
          try {
            combined += readStream(ref);
            combined += '\n';
          } catch {
            /* yut */
          }
        }
      } else if (contents) {
        combined = readStream(contents);
      }
      const { content, removed } = redactContentStream(combined, height, rects);
      totalRemoved += removed;
      const newStream = doc.context.flateStream(Buffer.from(content, 'latin1'));
      const ref = doc.context.register(newStream);
      page.node.set(PDFName.of('Contents'), doc.context.obj([ref]));
      for (const r of rects) {
        page.drawRectangle({ x: r.x, y: height - r.y - r.height, width: r.width, height: r.height, color: rgb(0, 0, 0), borderColor: rgb(0, 0, 0), borderWidth: 1 });
      }
    }
    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${byPage.size} sayfada ${totalRemoved} metin parçası kaldırıldı, alanlar karartıldı.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Redaksiyon hatası: ${errorMessage(err)}` };
  }
}

export async function pdfToWord(inPath: string, outPath: string): Promise<PdfOperationResult> {
  try {
    const textRes = await extractPdfText(inPath);
    if (!textRes.ok || !textRes.pages) return { ok: false, message: textRes.message };
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, convertMillimetersToTwip } = await import('docx');
    const children: FileChild[] = [];
    textRes.pages.forEach((pageText, i) => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Sayfa ${i + 1}`, bold: true, color: '6B7280' })], heading: HeadingLevel.HEADING_3 }),
      );
      const lines = pageText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) {
        children.push(new Paragraph({ text: '(Bu sayfada metin bulunamadı)' }));
        return;
      }
      for (const line of lines) {
        children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
      }
    });
    const document = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: convertMillimetersToTwip(20), bottom: convertMillimetersToTwip(20), left: convertMillimetersToTwip(20), right: convertMillimetersToTwip(20) },
            },
          },
          children,
        },
      ],
    });
    const buffer = await Packer.toBuffer(document);
    await fs.promises.writeFile(outPath, new Uint8Array(buffer as unknown as ArrayBuffer));
    return { ok: true, message: `PDF ${textRes.numPages ?? 0} sayfa olarak Word'e dönüştürüldü.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `PDF'ten Word'e dönüştürme hatası: ${errorMessage(err)}` };
  }
}

export interface PdfOcrOptions {
  language?: string;
  scale?: number;
}

export async function pdfOcr(inPath: string, outPath: string, opts: PdfOcrOptions = {}): Promise<PdfOperationResult> {
  try {
    const language = (opts.language || 'tur').trim() || 'tur';
    const scale = Math.max(1.5, Math.min(4, opts.scale || 2));
    const bytes = await fs.promises.readFile(inPath);

    const { createCanvas } = await import('@napi-rs/canvas');
    const init = {
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      useSystemFonts: true,
      disableWorker: true,
      disableFontFace: true,
      canvasFactory: createPdfCanvasFactory(),
    } as Parameters<typeof pdfjs.getDocument>[0];
    const pdf = await pdfjs.getDocument(init).promise;

    const pageImages: { width: number; height: number; png: Buffer }[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: vp } as unknown as Parameters<typeof page.render>[0]).promise;
      const { width, height } = page.getViewport({ scale: 1 });
      pageImages.push({ width, height, png: canvas.toBuffer('image/png') });
    }
    await pdf.destroy();

    const tesseract = await import('tesseract.js');
    const worker = await tesseract.createWorker(language, 1, {
      langPath: resolveOcrDir(),
      gzip: false,
      logger: () => {},
    });

    try {
      const out = await PDFDocument.create();
      const font = await embedTurkishFont(out, 'LiberationSans-Regular.ttf');

      for (const pg of pageImages) {
        const pageObj = out.addPage([pg.width, pg.height]);
        const img = await out.embedPng(pg.png);
        pageObj.drawImage(img, { x: 0, y: 0, width: pg.width, height: pg.height });

        const { data } = await worker.recognize(pg.png, {}, { text: true, blocks: true });

        for (const block of data.blocks || []) {
          for (const para of block.paragraphs) {
            for (const line of para.lines) {
              for (const w of line.words) {
                if (!w.text) continue;
                const wordWidth = (w.bbox.x1 - w.bbox.x0) / scale;
                const wordHeight = (w.bbox.y1 - w.bbox.y0) / scale;
                if (wordWidth <= 0 || wordHeight <= 0) continue;

                const x = w.bbox.x0 / scale;
                const yTop = pg.height - w.bbox.y0 / scale;
                const fontSize = Math.max(2, Math.min(144, wordHeight * 0.75));

                try {
                  pageObj.drawText(w.text, {
                    x,
                    y: yTop,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0),
                    opacity: 0,
                  });
                } catch {
                  /* glyph yoksa yut */
                }
              }
            }
          }
        }
      }

      await fs.promises.writeFile(outPath, await out.save());
      return { ok: true, message: `${pageImages.length} sayfa OCR ile taranabilir hale getirildi (${language}).`, output: outPath };
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    return { ok: false, message: `OCR hatası: ${errorMessage(err)}` };
  }
}

export interface PdfCompressOptions {
  quality?: number;
}

export async function pdfCompress(inPath: string, outPath: string, opts: PdfCompressOptions = {}): Promise<PdfOperationResult> {
  try {
    const quality = Math.max(0.1, Math.min(1, opts.quality ?? 0.7));
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const { createCanvas } = await import('@napi-rs/canvas');
    const maxDim = Math.round(400 + quality * 1600);
    let images = 0;

    for (const page of doc.getPages()) {
      const resources = page.node.Resources();
      if (!resources) continue;
      const xobjs = resources.lookup(PDFName.of('XObject')) as PDFDict | undefined;
      if (!xobjs) continue;
      for (const [name, ref] of xobjs.entries()) {
        if (!(ref instanceof Object)) continue;
        const stream = doc.context.lookup(ref as never) as PDFRawStream | undefined;
        if (!stream) continue;
        const subtype = stream.dict.get(PDFName.of('Subtype'));
        if (String(subtype) !== '/Image') continue;
        const w = Number(stream.dict.get(PDFName.of('Width')) || 0);
        const h = Number(stream.dict.get(PDFName.of('Height')) || 0);
        if (w === 0 || h === 0) continue;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        if (scale >= 1) continue;
        try {
          const sw = Math.max(1, Math.round(w * scale));
          const sh = Math.max(1, Math.round(h * scale));
          const decoded = decodePDFRawStream(stream).decode();
          const off = createCanvas(w, h);
          const ox = off.getContext('2d');
          const imgData = ox.createImageData(w, h);
          let j = 0;
          for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i] = decoded[j++];
            imgData.data[i + 1] = decoded[j++];
            imgData.data[i + 2] = decoded[j++];
            imgData.data[i + 3] = 255;
          }
          ox.putImageData(imgData, 0, 0);
          const out = createCanvas(sw, sh);
          out.getContext('2d').drawImage(off, 0, 0, sw, sh);
          const jpeg = out.toBuffer('image/jpeg', quality);
          const newImg = await doc.embedJpg(jpeg);
          xobjs.set(name, newImg.ref);
          doc.context.delete(ref as never);
          images += 1;
        } catch {
          /* görüntü dönüşmezse atla */
        }
      }
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${doc.getPageCount()} sayfa işlendi, ${images} görüntü sıkıştırıldı.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Sıkıştırma hatası: ${errorMessage(err)}` };
  }
}

export type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface PdfPageNumberOptions {
  start?: number;
  position?: PageNumberPosition;
  fontSize?: number;
  color?: string;
  format?: string;
  margin?: number;
}

export async function pdfPageNumbers(inPath: string, outPath: string, opts: PdfPageNumberOptions = {}): Promise<PdfOperationResult> {
  try {
    const start = opts.start ?? 1;
    const position = opts.position ?? 'bottom-center';
    const fontSize = Math.max(8, Math.min(24, opts.fontSize ?? 12));
    const format = opts.format ?? '{n}';
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
    const { r, g, b } = parseHexColor(opts.color || '#000000');
    const total = doc.getPageCount();

    const pos = (pageWidth: number, pageHeight: number, textWidth: number, m: number) => {
      const mapX: Record<PageNumberPosition, number> = {
        'top-left': m,
        'top-center': (pageWidth - textWidth) / 2,
        'top-right': pageWidth - textWidth - m,
        'bottom-left': m,
        'bottom-center': (pageWidth - textWidth) / 2,
        'bottom-right': pageWidth - textWidth - m,
      };
      const isTop = position.startsWith('top');
      return { x: mapX[position], y: isTop ? pageHeight - m - fontSize : m };
    };

    const margin = Math.max(12, Math.min(60, opts.margin ?? 24));
    doc.getPages().forEach((page, idx) => {
      const num = start + idx;
      const text = format.replace('{n}', String(num)).replace('{total}', String(total));
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const { x, y } = pos(width, height, textWidth, margin);
      page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b) });
    });

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${total} sayfaya numara eklendi (${position}).`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Numaralama hatası: ${errorMessage(err)}` };
  }
}

export interface PdfHeaderFooterOptions {
  header?: string;
  footer?: string;
  fontSize?: number;
  color?: string;
  margin?: number;
}

export async function pdfHeaderFooter(inPath: string, outPath: string, opts: PdfHeaderFooterOptions = {}): Promise<PdfOperationResult> {
  try {
    const header = (opts.header || '').trim();
    const footer = (opts.footer || '').trim();
    if (!header && !footer) return { ok: false, message: 'Üst bilgi veya alt bilgi metni girilmedi.' };
    const fontSize = Math.max(8, Math.min(18, opts.fontSize ?? 11));
    const margin = Math.max(12, Math.min(60, opts.margin ?? 28));
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
    const { r, g, b } = parseHexColor(opts.color || '#4b5563');

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      if (header) {
        const tw = font.widthOfTextAtSize(header, fontSize);
        page.drawText(header, { x: (width - tw) / 2, y: height - margin - fontSize, size: fontSize, font, color: rgb(r, g, b) });
      }
      if (footer) {
        const tw = font.widthOfTextAtSize(footer, fontSize);
        page.drawText(footer, { x: (width - tw) / 2, y: margin, size: fontSize, font, color: rgb(r, g, b) });
      }
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${doc.getPageCount()} sayfaya üst/alt bilgi eklendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Üst/alt bilgi hatası: ${errorMessage(err)}` };
  }
}

export async function pdfOrganize(inPath: string, outPath: string, opts: PdfOrganizeOptions = {}): Promise<PdfOperationResult> {
  try {
    const order = (opts.order || []).filter((n) => Number.isInteger(n) && n >= 1);
    if (!order.length) return { ok: false, message: 'Sayfa listesi boş.' };
    const bytes = await fs.promises.readFile(inPath);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    const rotate = opts.rotate || {};
    const out = await PDFDocument.create();
    let rotated = 0;
    for (const n of order) {
      if (n > total) return { ok: false, message: `Sayfa ${n} sınırlar dışında.` };
      const [copy] = await out.copyPages(src, [n - 1]);
      const deg = ((Number(rotate[String(n)]) || 0) % 360 + 360) % 360;
      if (deg) {
        copy.setRotation(degrees(deg));
        rotated += 1;
      }
      out.addPage(copy);
    }
    await fs.promises.writeFile(outPath, await out.save());
    return { ok: true, message: `${order.length} sayfa yazıldı (${rotated} döndürüldü).`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Sayfa yönetimi hatası: ${errorMessage(err)}` };
  }
}

export async function pdfPageSize(inPath: string, outPath: string, opts: PdfPageSizeOptions = {}): Promise<PdfOperationResult> {
  try {
    let w = opts.widthPt;
    let h = opts.heightPt;
    if (opts.preset && PAGE_SIZES_PT[opts.preset]) {
      w = PAGE_SIZES_PT[opts.preset].width;
      h = PAGE_SIZES_PT[opts.preset].height;
    }
    if (!w || !h || w <= 0 || h <= 0) return { ok: false, message: 'Geçerli bir sayfa boyutu belirtilmedi.' };
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = doc.getPageCount();
    for (const page of doc.getPages()) page.setSize(w, h);
    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${total} sayfanın boyutu güncellendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Sayfa boyutu hatası: ${errorMessage(err)}` };
  }
}

function pageContentToString(doc: PDFDocument, page: PDFPage): string {
  let combined = '';
  const contents = page.node.Contents();
  const readStream = (ref: unknown): string => {
    const stream = doc.context.lookup(ref as never, PDFStream);
    if (!stream) return '';
    if (stream instanceof PDFContentStream) {
      return stream.getContentsString();
    }
    try {
      const decoded = decodePDFRawStream(stream as unknown as never).decode();
      return Buffer.from(decoded).toString('latin1');
    } catch {
      return stream.getContentsString();
    }
  };
  if (contents instanceof PDFArray) {
    for (const ref of contents.asArray()) {
      try {
        combined += readStream(ref);
        combined += '\n';
      } catch {
        /* yut */
      }
    }
  } else if (contents) {
    combined = readStream(contents);
  }
  return combined;
}

function ensureResources(doc: PDFDocument, page: PDFPage): PDFDict {
  let resources = page.node.Resources();
  if (!resources) {
    resources = doc.context.obj({});
    page.node.set(PDFName.of('Resources'), resources);
  }
  return resources;
}

function ensureSubdict(doc: PDFDocument, resources: PDFDict, key: string): PDFDict {
  const existing = resources.lookup(PDFName.of(key));
  if (existing instanceof PDFDict) return existing;
  const dict = doc.context.obj({});
  resources.set(PDFName.of(key), dict);
  return dict;
}

export async function pdfBackground(inPath: string, outPath: string, opts: PdfBackgroundOptions = {}): Promise<PdfOperationResult> {
  try {
    const { r, g, b } = parseHexColor(opts.color || '#ffffff');
    const opacity = Math.max(0.05, Math.min(1, opts.opacity ?? 1));
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let image: PDFImage | null = null;
    if (opts.imagePath) {
      const imgBytes = await fs.promises.readFile(opts.imagePath);
      image = opts.imagePath.toLowerCase().endsWith('.png') ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
    }
    const gsRef = doc.context.register(doc.context.obj({ CA: opacity, ca: opacity, BM: 'Normal' }));

    let count = 0;
    for (const page of doc.getPages()) {
      const resources = ensureResources(doc, page);
      ensureSubdict(doc, resources, 'ExtGState').set(PDFName.of('AKGS'), gsRef);
      const { width, height } = page.getSize();
      let prefix = `q\n/AKGS gs\n`;
      if (image) {
        ensureSubdict(doc, resources, 'XObject').set(PDFName.of('AKBg'), image.ref);
        prefix += `${width} 0 0 ${height} 0 0 cm\n/AKBg Do\nQ\n`;
      } else {
        prefix += `${r} ${g} ${b} rg\n0 0 ${width} ${height} re\nf\nQ\n`;
      }
      const combined = prefix + pageContentToString(doc, page);
      const newStream = doc.context.flateStream(Buffer.from(combined, 'latin1'));
      const ref = doc.context.register(newStream);
      page.node.set(PDFName.of('Contents'), doc.context.obj([ref]));
      count += 1;
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${count} sayfaya arka plan uygulandı.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Arka plan hatası: ${errorMessage(err)}` };
  }
}

export async function pdfListFormFields(
  filePath: string,
): Promise<{ ok: boolean; message: string; fields?: PdfFormFieldInfo[] }> {
  try {
    const bytes = await fs.promises.readFile(filePath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields: PdfFormFieldInfo[] = form.getFields().map((f) => {
      const info: PdfFormFieldInfo = { name: f.getName(), type: 'unknown', readOnly: f.isReadOnly() };
      try {
        if (f instanceof PDFTextField) {
          info.type = 'text';
          info.value = f.getText() ?? '';
        } else if (f instanceof PDFCheckBox) {
          info.type = 'checkbox';
          info.value = f.isChecked() ? 'on' : 'off';
        } else if (f instanceof PDFRadioGroup) {
          info.type = 'radio';
          info.options = f.getOptions();
          info.value = f.getSelected() ?? '';
        } else if (f instanceof PDFDropdown) {
          info.type = 'dropdown';
          info.options = f.getOptions();
          info.value = f.getSelected()[0] ?? '';
        } else if (f instanceof PDFOptionList) {
          info.type = 'option-list';
          info.options = f.getOptions();
          info.value = f.getSelected()[0] ?? '';
        } else if (f instanceof PDFSignature) {
          info.type = 'signature';
        }
      } catch {
        /* tür okunamazsa unknown */
      }
      return info;
    });
    return { ok: true, message: `${fields.length} form alanı bulundu.`, fields };
  } catch (err) {
    return { ok: false, message: `Form okunamadı: ${errorMessage(err)}` };
  }
}

export async function pdfFillForm(inPath: string, outPath: string, opts: PdfFillFormOptions = {}): Promise<PdfOperationResult> {
  try {
    const values = opts.values || {};
    const keys = Object.keys(values).filter((k) => values[k] !== undefined && values[k] !== null);
    if (!keys.length) return { ok: false, message: 'Doldurulacak değer girilmedi.' };
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = doc.getForm();
    let filled = 0;

    for (const name of keys) {
      const field = form.getFieldMaybe(name);
      if (!field) continue;
      const value = String(values[name]);
      try {
        if (field instanceof PDFTextField) {
          field.setText(value);
          filled += 1;
        } else if (field instanceof PDFCheckBox) {
          const on = value === 'on' || value === '1' || value === 'true' || value === 'check';
          if (on) field.check();
          else field.uncheck();
          filled += 1;
        } else if (field instanceof PDFRadioGroup) {
          if (field.getOptions().includes(value)) {
            field.select(value);
            filled += 1;
          }
        } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
          const options = field.getOptions();
          const match = options.find((o) => o === value) ?? options.find((o) => o.toLowerCase() === value.toLowerCase());
          if (match) {
            field.select(match);
            filled += 1;
          }
        }
      } catch {
        /* değer alana uymazsa atla */
      }
    }

    if (!filled) return { ok: false, message: 'Form alanlarıyla eşleşen değer girilmedi.' };
    if (opts.flatten) {
      const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
      try {
        form.updateFieldAppearances(font);
      } catch {
        /* yut */
      }
      form.flatten({ updateFieldAppearances: false });
    }
    await fs.promises.writeFile(outPath, await doc.save());
    return {
      ok: true,
      message: `${filled} form alanı dolduruldu${opts.flatten ? ' ve kalıcı hale getirildi' : ''}.`,
      output: outPath,
    };
  } catch (err) {
    return { ok: false, message: `Form doldurma hatası: ${errorMessage(err)}` };
  }
}

function signAnchor(position: SignPosition | undefined, pageW: number, pageH: number, w: number, h: number, m: number): { x: number; y: number } {
  const pos = position ?? 'bottom-right';
  const isTop = pos.startsWith('top');
  const side = pos.split('-')[1] || 'right';
  const x = side === 'left' ? m : side === 'center' ? (pageW - w) / 2 : pageW - w - m;
  const y = isTop ? pageH - h - m : m;
  return { x, y };
}

export async function pdfSign(inPath: string, outPath: string, opts: PdfSignOptions = {}): Promise<PdfOperationResult> {
  try {
    const pageNum = Math.max(1, Math.round(opts.page || 1));
    const text = (opts.text || '').trim();
    if (!text && !opts.imagePath) return { ok: false, message: 'İmza metni veya görseli belirtilmedi.' };
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    if (pageNum > doc.getPageCount()) return { ok: false, message: `Sayfa ${pageNum} sınırlar dışında.` };
    const page = doc.getPage(pageNum - 1);
    const { width, height } = page.getSize();
    const margin = Math.max(12, Math.min(80, opts.margin ?? 40));
    const maxWidth = Math.max(40, Math.min(width - margin * 2, opts.maxWidth ?? 180));

    if (opts.imagePath) {
      const ext = opts.imagePath.toLowerCase();
      const imgBytes = await fs.promises.readFile(opts.imagePath);
      const img = ext.endsWith('.png') ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      const { width: iw, height: ih } = img.scaleToFit(maxWidth, height - margin * 2);
      const { x, y } = signAnchor(opts.position, width, height, iw, ih, margin);
      page.drawImage(img, { x, y, width: iw, height: ih });
    } else {
      const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
      let fontSize = Math.max(10, Math.min(64, opts.fontSize ?? 24));
      let tw = font.widthOfTextAtSize(text, fontSize);
      if (tw > maxWidth) {
        fontSize = Math.max(10, fontSize * (maxWidth / tw));
        tw = font.widthOfTextAtSize(text, fontSize);
      }
      const ih = fontSize * 1.4;
      const iw = tw + 8;
      const { x, y } = signAnchor(opts.position, width, height, iw, ih, margin);
      const { r, g, b } = parseHexColor(opts.color || '#1d4ed8');
      page.drawText(text, { x: x + 4, y: y + ih - fontSize, size: fontSize, font, color: rgb(r, g, b) });
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `İmza ${pageNum}. sayfaya eklendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `İmza hatası: ${errorMessage(err)}` };
  }
}

export async function pdfExportImages(
  inPath: string,
  outDir: string,
  opts: PdfExportImagesOptions = {},
): Promise<{ ok: boolean; message: string; outputs?: string[] }> {
  try {
    const format = opts.format === 'jpeg' ? 'jpeg' : 'png';
    const scale = Math.max(1, Math.min(4, opts.scale || 2));
    const bytes = await fs.promises.readFile(inPath);
    const { createCanvas } = await import('@napi-rs/canvas');
    const init = {
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      useSystemFonts: true,
      disableWorker: true,
      disableFontFace: true,
      canvasFactory: createPdfCanvasFactory(),
    } as Parameters<typeof pdfjs.getDocument>[0];
    const pdf = await pdfjs.getDocument(init).promise;
    await fs.promises.mkdir(outDir, { recursive: true });
    const outputs: string[] = [];
    const baseName = path.basename(inPath, path.extname(inPath));

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: vp } as unknown as Parameters<typeof page.render>[0]).promise;
      const buf = format === 'jpeg' ? canvas.toBuffer('image/jpeg', 0.85) : canvas.toBuffer('image/png');
      const outPath = path.join(outDir, `${baseName}-sayfa-${i}.${format}`);
      await fs.promises.writeFile(outPath, buf);
      outputs.push(outPath);
    }
    await pdf.destroy();
    return { ok: true, message: `${outputs.length} sayfa görüntü olarak dışa aktarıldı.`, outputs };
  } catch (err) {
    return { ok: false, message: `Görüntü dışa aktarma hatası: ${errorMessage(err)}` };
  }
}

export async function imagesToPdf(imagePaths: string[], outPath: string): Promise<PdfOperationResult> {
  try {
    if (!imagePaths || !imagePaths.length) return { ok: false, message: 'Dönüştürülecek görsel seçilmedi.' };
    const doc = await PDFDocument.create();
    for (const p of imagePaths) {
      const imgBytes = await fs.promises.readFile(p);
      const ext = p.toLowerCase();
      const img = ext.endsWith('.png') ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
      const { width, height } = img.size();
      const page = doc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }
    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${imagePaths.length} görsel PDF&apos;e dönüştürüldü.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Görselden PDF&apos;e dönüştürme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfGetMetadata(filePath: string): Promise<{ ok: boolean; message: string; metadata?: PdfMetadataInfo }> {
  try {
    const bytes = await fs.promises.readFile(filePath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const rawKw = doc.getKeywords();
    const keywords = rawKw ? rawKw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) : [];
    const metadata: PdfMetadataInfo = {
      title: doc.getTitle(),
      author: doc.getAuthor(),
      subject: doc.getSubject(),
      keywords,
    };
    return { ok: true, message: 'Meta veriler okundu.', metadata };
  } catch (err) {
    return { ok: false, message: `Meta veri okunamadı: ${errorMessage(err)}` };
  }
}

export async function pdfSetMetadata(inPath: string, outPath: string, meta: PdfMetadataInfo = {}): Promise<PdfOperationResult> {
  try {
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    if (meta.title !== undefined) doc.setTitle(meta.title);
    if (meta.author !== undefined) doc.setAuthor(meta.author);
    if (meta.subject !== undefined) doc.setSubject(meta.subject);
    if (meta.keywords !== undefined) doc.setKeywords(meta.keywords);
    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: 'PDF meta verileri güncellendi.', output: outPath };
  } catch (err) {
    return { ok: false, message: `Meta veri güncelleme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfBatesNumbering(inPath: string, outPath: string, opts: PdfBatesNumberingOptions = {}): Promise<PdfOperationResult> {
  try {
    const prefix = opts.prefix ?? 'DOC-';
    const start = opts.start ?? 1;
    const digits = Math.max(2, Math.min(8, opts.digits ?? 6));
    const position = opts.position ?? 'bottom-right';
    const fontSize = Math.max(8, Math.min(24, opts.fontSize ?? 10));
    const margin = Math.max(12, Math.min(60, opts.margin ?? 24));
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
    const { r, g, b } = parseHexColor(opts.color || '#111827');
    const total = doc.getPageCount();

    doc.getPages().forEach((page, idx) => {
      const numStr = String(start + idx).padStart(digits, '0');
      const text = `${prefix}${numStr}`;
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const { x, y } = signAnchor(position, width, height, textWidth, fontSize, margin);
      page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b) });
    });

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${total} sayfaya Bates seri numarası eklendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Bates numaralandırma hatası: ${errorMessage(err)}` };
  }
}

export async function pdfPermissions(
  inPath: string,
  outPath: string,
  opts: PdfPermissionsOptions = {},
): Promise<PdfOperationResult> {
  try {
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const printOpt = opts.printing === 'low' ? 'lowResolution' : opts.printing === 'none' ? false : 'highResolution';
    await doc.encrypt({
      userPassword: opts.userPassword || '',
      ownerPassword: opts.ownerPassword || 'owner123',
      permissions: {
        printing: printOpt,
        modifying: opts.modifying ?? false,
        copying: opts.copying ?? false,
        annotating: opts.annotating ?? true,
        documentAssembly: opts.documentAssembly ?? false,
      },
    });
    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: 'PDF güvenlik yetkileri başarıyla uygulandı.', output: outPath };
  } catch (err) {
    return { ok: false, message: `Yetkilendirme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfAddFormField(
  inPath: string,
  outPath: string,
  opts: PdfAddFormFieldOptions = {},
): Promise<PdfOperationResult> {
  try {
    const pageNum = Math.max(1, Math.round(opts.page || 1));
    const type = opts.type || 'text';
    const name = (opts.name || `field_${Date.now()}`).trim();
    const x = opts.x ?? 50;
    const y = opts.y ?? 100;
    const width = Math.max(20, opts.width ?? 150);
    const height = Math.max(10, opts.height ?? 24);

    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    doc.registerFontkit(fontkit);
    const font = await embedTurkishFont(doc, 'LiberationSans-Regular.ttf');
    if (pageNum > doc.getPageCount()) return { ok: false, message: `Sayfa ${pageNum} sınırlar dışında.` };
    const page = doc.getPage(pageNum - 1);
    const form = doc.getForm();

    if (type === 'checkbox') {
      const cb = form.createCheckBox(name);
      cb.addToPage(page, { x, y, width: Math.min(width, height), height: Math.min(width, height) });
    } else if (type === 'dropdown') {
      const dd = form.createDropdown(name);
      const options = opts.options && opts.options.length ? opts.options : ['Secenek 1', 'Secenek 2'];
      dd.addOptions(options);
      dd.addToPage(page, { x, y, width, height, font });
      if (opts.defaultValue && options.includes(opts.defaultValue)) dd.select(opts.defaultValue);
    } else {
      const tf = form.createTextField(name);
      tf.addToPage(page, { x, y, width, height, font });
      if (opts.defaultValue) tf.setText(opts.defaultValue);
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `Yeni ${type} formu alanı (${name}) eklendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Form alanı ekleme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfAttachFile(
  inPath: string,
  outPath: string,
  opts: PdfAttachFileOptions = {},
): Promise<PdfOperationResult> {
  try {
    if (!opts.filePath) return { ok: false, message: 'Eklenecek dosya seçilmedi.' };
    const attBytes = await fs.promises.readFile(opts.filePath);
    const attName = path.basename(opts.filePath);
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const fileStream = doc.context.flateStream(attBytes);
    const fileStreamRef = doc.context.register(fileStream);
    const fileSpec = doc.context.obj({
      Type: 'Filespec',
      F: attName,
      UF: attName,
      EF: { F: fileStreamRef },
      Desc: opts.description || attName,
    });
    const fileSpecRef = doc.context.register(fileSpec);

    let catalog = doc.catalog;
    let names = catalog.lookup(PDFName.of('Names')) as PDFDict;
    if (!(names instanceof PDFDict)) {
      names = doc.context.obj({});
      catalog.set(PDFName.of('Names'), names);
    }
    let embFiles = names.lookup(PDFName.of('EmbeddedFiles')) as PDFDict;
    if (!(embFiles instanceof PDFDict)) {
      embFiles = doc.context.obj({ Names: doc.context.obj([attName, fileSpecRef]) });
      names.set(PDFName.of('EmbeddedFiles'), embFiles);
    } else {
      let nameTree = embFiles.lookup(PDFName.of('Names')) as PDFArray;
      if (!(nameTree instanceof PDFArray)) {
        nameTree = doc.context.obj([]);
        embFiles.set(PDFName.of('Names'), nameTree);
      }
      nameTree.push(doc.context.obj(attName));
      nameTree.push(fileSpecRef);
    }

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `"${attName}" dosyası PDF içerisine iliştirildi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Dosya ekleme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfSetBookmarks(
  inPath: string,
  outPath: string,
  bookmarks: PdfBookmarkSpec[] = [],
): Promise<PdfOperationResult> {
  try {
    if (!bookmarks.length) return { ok: false, message: 'Eklenecek yer imi bulunamadı.' };
    const bytes = await fs.promises.readFile(inPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();

    const outlinesDictRef = doc.context.nextRef();
    const itemRefs = bookmarks.map(() => doc.context.nextRef());

    const items = bookmarks.map((b, idx) => {
      const pageNum = Math.max(1, Math.min(totalPages, b.page)) - 1;
      const pageRef = doc.getPage(pageNum).ref;
      const item: Record<string, unknown> = {
        Type: 'Outline',
        Title: b.title,
        Parent: outlinesDictRef,
        Dest: [pageRef, 'XYZ', null, null, null],
      };
      if (idx > 0) item.Prev = itemRefs[idx - 1];
      if (idx < bookmarks.length - 1) item.Next = itemRefs[idx + 1];
      return doc.context.obj(item as Parameters<typeof doc.context.obj>[0]);
    });

    for (let i = 0; i < items.length; i++) {
      doc.context.assign(itemRefs[i], items[i]);
    }

    const outlinesDict = doc.context.obj({
      Type: 'Outlines',
      First: itemRefs[0],
      Last: itemRefs[itemRefs.length - 1],
      Count: bookmarks.length,
    });
    doc.context.assign(outlinesDictRef, outlinesDict);

    doc.catalog.set(PDFName.of('Outlines'), outlinesDictRef);

    await fs.promises.writeFile(outPath, await doc.save());
    return { ok: true, message: `${bookmarks.length} yer imi başarıyla eklendi.`, output: outPath };
  } catch (err) {
    return { ok: false, message: `Yer imi ekleme hatası: ${errorMessage(err)}` };
  }
}

export async function pdfImportAsVisualHtml(
  filePath: string,
): Promise<{ ok: boolean; message: string; html?: string; numPages?: number }> {
  try {
    const bytes = await fs.promises.readFile(filePath);
    const { createCanvas } = await import('@napi-rs/canvas');
    const init = {
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      canvasFactory: createPdfCanvasFactory(),
    } as Parameters<typeof pdfjs.getDocument>[0];
    const pdf = await pdfjs.getDocument(init).promise;
    const numPages = pdf.numPages;
    let html = '';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: vp } as unknown as Parameters<typeof page.render>[0]).promise;
      const b64 = canvas.toBuffer('image/png').toString('base64');
      const src = `data:image/png;base64,${b64}`;
      html += `<div class="pdf-import-page" style="margin-bottom: 24px;"><p><strong>Sayfa ${i}</strong></p><p><img src="${src}" alt="Sayfa ${i}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px;"/></p></div>`;
    }
    await pdf.destroy();
    return { ok: true, message: `${numPages} sayfa görsel ve yerleşim olarak içe aktarıldı.`, html, numPages };
  } catch (err) {
    return { ok: false, message: `PDF görsel içe aktarılamadı: ${errorMessage(err)}` };
  }
}
