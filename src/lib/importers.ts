import mammoth from 'mammoth';
import { marked } from 'marked';
import { base64ToArrayBuffer, escapeHtml } from './utils';

export async function importDocxAsHtml(base64: string): Promise<string> {
  const arrayBuffer = base64ToArrayBuffer(base64);
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

export function importMarkdownAsHtml(text: string): string {
  return marked.parse(text, { gfm: true, breaks: true }) as string;
}

export function importTextAsHtml(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const lines = p.split('\n').map((l) => escapeHtml(l)).join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

const CELL_SEP = /[\t]| {2,}/;

function looksLikeTable(rows: string[]): boolean {
  const cellCounts = rows.map((r) => r.trim().split(CELL_SEP).filter(Boolean).length);
  const valid = cellCounts.filter((c) => c >= 2);
  return valid.length >= 2 && new Set(valid).size === 1;
}

function tableFromRows(rows: string[]): string {
  const trs = rows
    .map((r) => {
      const cells = r.trim().split(CELL_SEP).filter(Boolean);
      return `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`;
    })
    .join('');
  return `<table><thead><tr>${rows[0]
    .trim()
    .split(CELL_SEP)
    .filter(Boolean)
    .map((c) => `<th>${escapeHtml(c)}</th>`)
    .join('')}</tr></thead><tbody>${trs.slice(1)}</tbody></table>`;
}

function splitPdfTextToBlocks(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n{2,}/);
}

export function pdfPagesToHtml(pages: string[]): string {
  return pages
    .map((text, i) => {
      const blocks = splitPdfTextToBlocks(text);
      const body = blocks
        .map((block) => {
          const rows = block.split('\n').map((r) => r.trimEnd());
          if (looksLikeTable(rows)) {
            return tableFromRows(rows);
          }
          return rows.map((r) => `<p>${escapeHtml(r)}</p>`).join('');
        })
        .join('');
      return `<div class="pdf-import-page"><h3>Sayfa ${i + 1}</h3>${body}</div>`;
    })
    .join('');
}
