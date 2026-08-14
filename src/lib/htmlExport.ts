import type { DocumentState, PrintOptions } from '@/types';
import { escapeHtml, mmToInches } from './utils';

const BASE_CONTENT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }
  .ak-content { max-width: 100%; }
  .ak-content p { margin: 0 0 8pt 0; }
  .ak-content h1 { font-size: 20pt; margin: 12pt 0 8pt; font-weight: 700; }
  .ak-content h2 { font-size: 16pt; margin: 12pt 0 8pt; font-weight: 700; }
  .ak-content h3 { font-size: 13pt; margin: 10pt 0 6pt; font-weight: 700; }
  .ak-content ul, .ak-content ol { margin: 4pt 0 8pt; padding-left: 24pt; }
  .ak-content li { margin: 2pt 0; }
  .ak-content a { color: #2563eb; }
  .ak-content blockquote { border-left: 3pt solid #9ca3af; margin: 8pt 0; padding: 2pt 12pt; color: #4b5563; }
  .ak-content code { font-family: Consolas, monospace; background: #f3f4f6; padding: 1pt 3pt; border-radius: 2pt; font-size: 10pt; }
  .ak-content pre { background: #f3f4f6; padding: 8pt; border-radius: 4pt; font-family: Consolas, monospace; font-size: 10pt; white-space: pre-wrap; }
  .ak-content img { max-width: 100%; height: auto; }
  .ak-content table { border-collapse: collapse; width: 100%; margin: 8pt 0; page-break-inside: auto; }
  .ak-content th { background: #eef2f7; font-weight: 600; }
  .ak-content th, .ak-content td { border: 1px solid #cbd5e1; padding: 4pt 6pt; font-size: 10pt; }
  .ak-content hr { border: none; border-top: 1px solid #d1d5db; margin: 10pt 0; }
  .ak-content .pdf-import-page { page-break-before: always; }
  .ak-content .pdf-import-page:first-of-type { page-break-before: auto; }
  .ak-content .pdf-import-page h3 { color: #6b7280; font-size: 10pt; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 3pt; }
  .selectedText { background: #dbeafe; }
`;

function hfTemplate(text: string, withPageNumber: boolean, align: string, position: 'top' | 'bottom'): string {
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const paddingTop = position === 'top' ? '4px' : '0';
  const paddingBottom = position === 'bottom' ? '4px' : '0';
  const content = `${escapeHtml(text)}${
    withPageNumber
      ? ` &nbsp;<span class="pageNumber" style="font-weight:600"></span> / <span class="totalPages"></span>`
      : ''
  }`;
  return `<div style="width:100%; display:flex; justify-content:${justify}; align-items:center; font-family:'Segoe UI',sans-serif; font-size:8pt; color:#6b7280; padding:${paddingTop} 8px ${paddingBottom} 8px;">${content}</div>`;
}

export function buildExportBundle(bodyHtml: string, doc: DocumentState): { html: string; opts: PrintOptions } {
  const { size, orientation, margins } = doc.page;

  const headerTemplate =
    doc.header.enabled && (doc.header.text || doc.header.pageNumber)
      ? hfTemplate(doc.header.text, doc.header.pageNumber, doc.header.align, 'top')
      : '';
  const footerTemplate =
    doc.footer.enabled && (doc.footer.text || doc.footer.pageNumber)
      ? hfTemplate(doc.footer.text, doc.footer.pageNumber, doc.footer.align, 'bottom')
      : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${BASE_CONTENT_CSS}</style>
</head>
<body>
<div class="ak-content">${bodyHtml}</div>
</body>
</html>`;

  const opts: PrintOptions = {
    pageSize: size,
    landscape: orientation === 'landscape',
    margins: {
      top: margins.top + (headerTemplate ? 12 : 0),
      bottom: margins.bottom + (footerTemplate ? 12 : 0),
      left: margins.left,
      right: margins.right,
    },
    headerTemplate,
    footerTemplate,
  };

  return { html, opts };
}

export { mmToInches };
