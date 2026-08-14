import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import workerRaw from 'pdfjs-dist/legacy/build/pdf.worker.js?raw';

let workerReady = false;
function ensureWorker(): void {
  if (workerReady) return;
  const blob = new Blob([workerRaw], { type: 'application/javascript' });
  pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
  workerReady = true;
}

export function base64ToUint8(base64: string): Uint8Array {
  const data = atob(base64);
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) bytes[i] = data.charCodeAt(i);
  return bytes;
}

export async function loadPdfDoc(base64: string): Promise<pdfjsLib.PDFDocumentProxy> {
  ensureWorker();
  const task = pdfjsLib.getDocument({ data: base64ToUint8(base64) });
  return task.promise;
}

export interface RenderedThumb {
  dataUrl: string;
  ratio: number;
  pageWidthPt: number;
  pageHeightPt: number;
}

export async function renderPdfPage(doc: pdfjsLib.PDFDocumentProxy, pageNum: number, renderWidth: number): Promise<RenderedThumb> {
  const page = await doc.getPage(pageNum);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = renderWidth / vp1.width;
  const vp = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas desteklenmiyor.');
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return {
    dataUrl: canvas.toDataURL('image/png'),
    ratio: vp1.height / vp1.width,
    pageWidthPt: vp1.width,
    pageHeightPt: vp1.height,
  };
}

export interface TextItemBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSizePt: number;
  pdfX: number;
  pdfBaseline: number;
  pdfWidth: number;
  pdfHeight: number;
}

export async function getTextItemBoxes(doc: pdfjsLib.PDFDocumentProxy, pageNum: number, renderWidth: number, cssWidth: number): Promise<TextItemBox[]> {
  const page = await doc.getPage(pageNum);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = renderWidth / vp1.width;
  const vp = page.getViewport({ scale });
  const tc = await page.getTextContent();
  const view = page.view;
  const mediaH = Array.isArray(view) && view.length >= 4 ? view[3] : vp1.height;
  const cssScale = cssWidth / renderWidth;
  const items: TextItemBox[] = [];
  for (const raw of tc.items) {
    const it = raw as { str?: string; transform?: number[]; width?: number; height?: number };
    const str = (it.str ?? '').replace(/\s+/g, ' ').trim();
    if (!str || !it.transform || it.transform.length < 6) continue;
    const fontSize = typeof it.height === 'number' && it.height > 0 ? it.height : 12;
    const [a, b, c, d, e, f] = it.transform;
    const pdfWidth = typeof it.width === 'number' && it.width > 0 ? it.width : str.length * fontSize * 0.5;
    const pdfHeight = fontSize;
    const [x0, y0] = vp.convertToViewportPoint(e, f);
    const [x1, y1] = vp.convertToViewportPoint(e + pdfWidth, f + pdfHeight);
    items.push({
      x: Math.min(x0, x1) * cssScale,
      y: Math.min(y0, y1) * cssScale,
      width: Math.max(8, Math.abs(x1 - x0) * cssScale),
      height: Math.max(10, Math.abs(y1 - y0) * cssScale),
      text: str,
      fontSizePt: fontSize,
      pdfX: e,
      pdfBaseline: f,
      pdfWidth,
      pdfHeight,
    });
  }
  return items;
}
