import type { Align, PageSettings, Orientation, PageSize } from '@/types';

export const MM_PER_INCH = 25.4;
export const PX_PER_MM = 96 / MM_PER_INCH;

export const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  A5: { width: 148, height: 210 },
};

export const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  A4: 'A4',
  Letter: 'Letter',
  A5: 'A5',
};

export const MARGIN_PRESETS: Record<string, { top: number; bottom: number; left: number; right: number }> = {
  normal: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
  narrow: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 },
  moderate: { top: 19.05, bottom: 19.05, left: 19.05, right: 19.05 },
  wide: { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 },
};

export const FONT_FAMILIES: { name: string; stack: string }[] = [
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { name: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
  { name: 'Georgia', stack: 'Georgia, serif' },
  { name: 'Calibri', stack: 'Calibri, "Segoe UI", sans-serif' },
  { name: 'Cambria', stack: 'Cambria, Georgia, serif' },
  { name: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma', stack: 'Tahoma, Geneva, sans-serif' },
  { name: 'Segoe UI', stack: '"Segoe UI", system-ui, sans-serif' },
  { name: 'Garamond', stack: 'Garamond, "Times New Roman", serif' },
  { name: 'Courier New', stack: '"Courier New", Courier, monospace' },
  { name: 'Consolas', stack: 'Consolas, "Courier New", monospace' },
  { name: 'Comic Sans MS', stack: '"Comic Sans MS", cursive' },
];

export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72];

export const LINE_SPACINGS = [
  { label: '1,0', value: '1' },
  { label: '1,15', value: '1.15' },
  { label: '1,5', value: '1.5' },
  { label: '2,0', value: '2' },
  { label: '2,5', value: '2.5' },
  { label: '3,0', value: '3' },
];

export const ALIGN_ICON: Record<Align, string> = {
  left: 'align-left',
  center: 'align-center',
  right: 'align-right',
  justify: 'align-justify',
};

export function getPageSizeMm(size: PageSize, orientation: Orientation): { width: number; height: number } {
  const base = PAGE_SIZES_MM[size];
  return orientation === 'landscape'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function mmToInches(mm: number): number {
  return Math.max(mm / MM_PER_INCH, 0.04);
}

export function defaultPageSettings(): PageSettings {
  return { size: 'A4', orientation: 'portrait', margins: { ...MARGIN_PRESETS.normal } };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function bytesToBase64(bytes: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes as unknown as BlobPart]);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'belge';
}
