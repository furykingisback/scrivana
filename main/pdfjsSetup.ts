import { DOMMatrix, Path2D, createCanvas } from '@napi-rs/canvas';
import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';

if (!(globalThis as Record<string, unknown>).DOMMatrix) {
  (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrix;
}
if (!(globalThis as Record<string, unknown>).Path2D) {
  (globalThis as Record<string, unknown>).Path2D = Path2D;
}

export interface PdfCanvasEntry {
  canvas: Canvas;
  context: SKRSContext2D;
}

export function createPdfCanvasFactory(): {
  create: (width: number, height: number) => PdfCanvasEntry;
  reset: (entry: PdfCanvasEntry, width: number, height: number) => void;
  destroy: (entry: PdfCanvasEntry) => void;
} {
  return {
    create: (width, height) => {
      const canvas = createCanvas(width, height);
      return { canvas, context: canvas.getContext('2d') };
    },
    reset: (entry, width, height) => {
      entry.canvas.width = width;
      entry.canvas.height = height;
    },
    destroy: () => undefined,
  };
}
