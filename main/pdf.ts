import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { ChildProcess, fork } from 'child_process';
import { BrowserWindow } from 'electron';

import { parsePageRanges, PAGE_SIZES_PT, PdfOperationResult, PdfTaskName } from './pdfOps';

export { parsePageRanges, PAGE_SIZES_PT };
export type { PdfOperationResult };

export interface HtmlToPdfOptions {
  pageSize: string;
  landscape: boolean;
  margins: { top: number; bottom: number; left: number; right: number };
  headerTemplate: string;
  footerTemplate: string;
}

let child: ChildProcess | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getChild(): ChildProcess {
  if (!child) {
    child = fork(path.join(__dirname, 'pdfWorker.js'), [], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
    child.on('message', (msg: { id: number; result?: unknown; error?: string }) => {
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.result);
    });
    child.on('exit', () => {
      child = null;
      const errors = Array.from(pending.values());
      pending.clear();
      for (const p of errors) p.reject(new Error('PDF işlemci kapanmış, işlem yarıda kaldı.'));
    });
  }
  return child;
}

async function runTask(task: PdfTaskName, args: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getChild().send({ id, task, args });
  });
}

export const pdfPageCount = (p: string): Promise<number> => runTask('pdfPageCount', [p]) as Promise<number>;
export const extractPdfText = (p: string): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }> =>
  runTask('extractPdfText', [p]) as Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }>;
export const pdfSmartImportText = (p: string): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }> =>
  runTask('pdfSmartImportText', [p]) as Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }>;
export const mergePdfs = (paths: string[], outPath: string): Promise<PdfOperationResult> =>
  runTask('mergePdfs', [paths, outPath]) as Promise<PdfOperationResult>;
export const splitPdf = (inPath: string, ranges: string[], outDir: string): Promise<PdfOperationResult> =>
  runTask('splitPdf', [inPath, ranges, outDir]) as Promise<PdfOperationResult>;
export const encryptPdf = (inPath: string, outPath: string, password: string): Promise<PdfOperationResult> =>
  runTask('encryptPdf', [inPath, outPath, password]) as Promise<PdfOperationResult>;
export const decryptPdf = (inPath: string, outPath: string, password: string): Promise<PdfOperationResult> =>
  runTask('decryptPdf', [inPath, outPath, password]) as Promise<PdfOperationResult>;
export const watermarkPdf = (
  inPath: string,
  outPath: string,
  opts: { text: string; fontSize: number; opacity: number; color: string; rotate: number; repeat: boolean },
): Promise<PdfOperationResult> => runTask('watermarkPdf', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfToWord = (inPath: string, outPath: string): Promise<PdfOperationResult> =>
  runTask('pdfToWord', [inPath, outPath]) as Promise<PdfOperationResult>;
export const pdfRebuild = (inputs: string[], outPath: string, pages: unknown[]): Promise<PdfOperationResult> =>
  runTask('pdfRebuildPdf', [inputs, outPath, pages]) as Promise<PdfOperationResult>;
export const pdfEditText = (inPath: string, outPath: string, edits: unknown[]): Promise<PdfOperationResult> =>
  runTask('pdfEditText', [inPath, outPath, edits]) as Promise<PdfOperationResult>;
export const pdfRedact = (inPath: string, outPath: string, redactions: unknown[]): Promise<PdfOperationResult> =>
  runTask('pdfRedact', [inPath, outPath, redactions]) as Promise<PdfOperationResult>;
export const pdfOcr = (
  inPath: string,
  outPath: string,
  opts: { language?: string; scale?: number },
): Promise<PdfOperationResult> => runTask('pdfOcr', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfCompress = (inPath: string, outPath: string, opts: { quality?: number }): Promise<PdfOperationResult> =>
  runTask('pdfCompress', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfPageNumbers = (
  inPath: string,
  outPath: string,
  opts: { start?: number; position?: string; fontSize?: number; color?: string; format?: string; margin?: number },
): Promise<PdfOperationResult> => runTask('pdfPageNumbers', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfHeaderFooter = (
  inPath: string,
  outPath: string,
  opts: { header?: string; footer?: string; fontSize?: number; color?: string; margin?: number },
): Promise<PdfOperationResult> => runTask('pdfHeaderFooter', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfOrganize = (
  inPath: string,
  outPath: string,
  opts: { order: number[]; rotate?: Record<string, number> },
): Promise<PdfOperationResult> => runTask('pdfOrganize', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfPageSize = (
  inPath: string,
  outPath: string,
  opts: { preset?: string; widthPt?: number; heightPt?: number },
): Promise<PdfOperationResult> => runTask('pdfPageSize', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfBackground = (
  inPath: string,
  outPath: string,
  opts: { color?: string; opacity?: number; imagePath?: string },
): Promise<PdfOperationResult> => runTask('pdfBackground', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfListFormFields = (p: string): Promise<{ ok: boolean; message: string; fields?: unknown[] }> =>
  runTask('pdfListFormFields', [p]) as Promise<{ ok: boolean; message: string; fields?: unknown[] }>;
export const pdfFillForm = (
  inPath: string,
  outPath: string,
  opts: { values: Record<string, string>; flatten?: boolean },
): Promise<PdfOperationResult> => runTask('pdfFillForm', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfSign = (
  inPath: string,
  outPath: string,
  opts: { page?: number; position?: string; text?: string; imagePath?: string; fontSize?: number; color?: string; maxWidth?: number; margin?: number },
): Promise<PdfOperationResult> => runTask('pdfSign', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfExportImages = (
  inPath: string,
  outDir: string,
  opts: { format?: 'png' | 'jpeg'; scale?: number },
): Promise<{ ok: boolean; message: string; outputs?: string[] }> =>
  runTask('pdfExportImages', [inPath, outDir, opts]) as Promise<{ ok: boolean; message: string; outputs?: string[] }>;
export const imagesToPdf = (imagePaths: string[], outPath: string): Promise<PdfOperationResult> =>
  runTask('imagesToPdf', [imagePaths, outPath]) as Promise<PdfOperationResult>;
export const pdfGetMetadata = (filePath: string): Promise<{ ok: boolean; message: string; metadata?: unknown }> =>
  runTask('pdfGetMetadata', [filePath]) as Promise<{ ok: boolean; message: string; metadata?: unknown }>;
export const pdfSetMetadata = (inPath: string, outPath: string, meta: unknown): Promise<PdfOperationResult> =>
  runTask('pdfSetMetadata', [inPath, outPath, meta]) as Promise<PdfOperationResult>;
export const pdfBatesNumbering = (
  inPath: string,
  outPath: string,
  opts: { prefix?: string; start?: number; digits?: number; position?: string; fontSize?: number; color?: string; margin?: number },
): Promise<PdfOperationResult> => runTask('pdfBatesNumbering', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfPermissions = (
  inPath: string,
  outPath: string,
  opts: { userPassword?: string; ownerPassword?: string; printing?: string; modifying?: boolean; copying?: boolean; annotating?: boolean; documentAssembly?: boolean },
): Promise<PdfOperationResult> => runTask('pdfPermissions', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfAddFormField = (
  inPath: string,
  outPath: string,
  opts: { page?: number; type?: string; name?: string; x?: number; y?: number; width?: number; height?: number; defaultValue?: string; options?: string[] },
): Promise<PdfOperationResult> => runTask('pdfAddFormField', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfAttachFile = (
  inPath: string,
  outPath: string,
  opts: { filePath?: string; description?: string },
): Promise<PdfOperationResult> => runTask('pdfAttachFile', [inPath, outPath, opts]) as Promise<PdfOperationResult>;
export const pdfSetBookmarks = (
  inPath: string,
  outPath: string,
  bookmarks: { title: string; page: number }[],
): Promise<PdfOperationResult> => runTask('pdfSetBookmarks', [inPath, outPath, bookmarks]) as Promise<PdfOperationResult>;
export const pdfImportAsVisualHtml = (
  p: string,
): Promise<{ ok: boolean; message: string; html?: string; numPages?: number }> =>
  runTask('pdfImportAsVisualHtml', [p]) as Promise<{ ok: boolean; message: string; html?: string; numPages?: number }>;
export const readPdfFileBase64 = (filePath: string): Promise<{ ok: boolean; base64?: string; message?: string }> =>
  runTask('readFileBase64', [filePath]) as Promise<{ ok: boolean; base64?: string; message?: string }>;

export async function htmlToPdfBuffer(html: string, opts: HtmlToPdfOptions): Promise<Buffer> {
  let win: BrowserWindow | null = null;
  let tmpFile = '';
  try {
    tmpFile = path.join(os.tmpdir(), `ak-print-${crypto.randomBytes(8).toString('hex')}.html`);
    await fs.promises.writeFile(tmpFile, html, 'utf-8');
    win = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        javascript: true,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    await win.loadFile(tmpFile);
    await new Promise((resolve) => setTimeout(resolve, 400));
    await win.webContents.executeJavaScript('document.fonts ? document.fonts.ready.then(() => true) : true').catch(() => undefined);

    const inches = (mm: number) => Math.max(mm / 25.4, 0.04);
    const data = await win.webContents.printToPDF({
      pageSize: opts.pageSize as 'A4',
      landscape: opts.landscape,
      printBackground: true,
      margins: {
        top: inches(opts.margins.top),
        bottom: inches(opts.margins.bottom),
        left: inches(opts.margins.left),
        right: inches(opts.margins.right),
      },
      displayHeaderFooter: Boolean(opts.headerTemplate || opts.footerTemplate),
      headerTemplate: opts.headerTemplate || '<p></p>',
      footerTemplate: opts.footerTemplate || '<p></p>',
    });
    return Buffer.from(data);
  } catch (err) {
    throw err;
  } finally {
    if (win) win.destroy();
    if (tmpFile) fs.promises.unlink(tmpFile).catch(() => undefined);
  }
}

export async function htmlToPdf(html: string, outPath: string, opts: HtmlToPdfOptions): Promise<PdfOperationResult> {
  try {
    const data = await htmlToPdfBuffer(html, opts);
    await fs.promises.writeFile(outPath, data);
    return { ok: true, message: 'PDF dışa aktarıldı.', output: outPath };
  } catch (err) {
    return { ok: false, message: `PDF oluşturma hatası: ${err instanceof Error ? err.message : String(err)}` };
  }
}
