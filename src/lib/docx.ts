import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageNumber,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import type { DocumentState } from '@/types';
import { fillTemplateFields } from './docxTemplate';

type RunChild = TextRun | ExternalHyperlink | ImageRun;

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  highlight?: string;
  font?: string;
  size?: number;
}

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(5) } } },
        },
      ],
    },
    {
      reference: 'numbers',
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(5) } } },
        },
      ],
    },
  ],
};

function runProps(st: RunStyle): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  if (st.bold) props.bold = true;
  if (st.italic) props.italic = true;
  if (st.underline) props.underline = {};
  if (st.strike) props.strike = true;
  if (st.color) props.color = st.color;
  if (st.highlight) props.highlight = st.highlight;
  if (st.font) props.font = st.font;
  if (st.size) props.size = st.size;
  return props;
}

function cssVar(style: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*:\\s*([^;]+)`);
  const m = style.match(re);
  return m ? m[1].trim().replace(/["']/g, '') : undefined;
}

function collectRuns(node: Node, st: RunStyle, out: RunChild[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) out.push(new TextRun({ text, ...runProps(st) }));
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const next: RunStyle = { ...st };

    if (tag === 'b' || tag === 'strong') next.bold = true;
    else if (tag === 'i' || tag === 'em') next.italic = true;
    else if (tag === 'u') next.underline = true;
    else if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true;
    else if (tag === 'span') {
      const s = el.getAttribute('style') ?? '';
      const color = cssVar(s, 'color');
      if (color) next.color = color;
      const bg = cssVar(s, 'background-color');
      if (bg) next.highlight = bg;
      const ff = cssVar(s, 'font-family');
      if (ff) next.font = ff.split(',')[0].trim();
      const fs = s.match(/font-size:\s*(\d+(?:\.\d+)?)(px|pt)/i);
      if (fs) next.size = Math.round(parseFloat(fs[1]) * (fs[2] === 'px' ? 1.5 : 2));
    } else if (tag === 'img') {
      const src = el.getAttribute('src') ?? '';
      const type = src.startsWith('data:image/png') ? 'png' : src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg') ? 'jpg' : 'png';
      const b64 = src.split(',')[1] ?? '';
      if (b64) {
        const w = Number(el.getAttribute('data-w') ?? 300);
        const h = Number(el.getAttribute('data-h') ?? 200);
        out.push(new ImageRun({ type, data: b64, transformation: { width: w, height: h } }));
      }
      continue;
    } else if (tag === 'a') {
      const href = el.getAttribute('href') ?? '';
      const inner: TextRun[] = [];
      const tmp: RunChild[] = [];
      collectRuns(el, { ...next }, tmp);
      for (const t of tmp) if (t instanceof TextRun) inner.push(t);
      out.push(new ExternalHyperlink({ link: href, children: inner }));
      continue;
    } else if (tag === 'code') {
      next.font = 'Consolas';
      next.size = next.size ?? 20;
    }

    collectRuns(el, next, out);
  }
}

function getTextAlign(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined {
  const align = cssVar(el.getAttribute('style') ?? '', 'text-align');
  if (!align) return undefined;
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function getLineSpacing(el: HTMLElement): number | undefined {
  const lh = cssVar(el.getAttribute('style') ?? '', 'line-height');
  if (!lh) return undefined;
  const n = parseFloat(lh);
  if (Number.isNaN(n)) return undefined;
  return Math.round(n * 240);
}

function paragraphFromEl(el: HTMLElement, listType?: 'bullets' | 'numbers', level = 0): Paragraph {
  const runs: RunChild[] = [];
  collectRuns(el, {}, runs);
  const opts: Record<string, unknown> = { children: runs };
  const align = getTextAlign(el);
  if (align) opts.alignment = align;
  const spacing = getLineSpacing(el);
  if (spacing) opts.spacing = { line: spacing };
  if (listType) opts.numbering = { reference: listType, level };
  return new Paragraph(opts);
}

function contentParagraphs(node: Element): Paragraph[] {
  const children = Array.from(node.children).filter((c) => c.tagName === 'P' || c.tagName === 'H1' || c.tagName === 'H2' || c.tagName === 'H3' || c.tagName === 'DIV' || c.tagName === 'BR');
  if (children.length) {
    const result: Paragraph[] = [];
    for (const c of children) result.push(...blockFromEl(c as HTMLElement));
    return result;
  }
  return [paragraphFromEl(node as HTMLElement)];
}

function blockFromEl(el: HTMLElement): Paragraph[] {
  const tag = el.tagName.toLowerCase();
  if (tag === 'h1') {
    return [new Paragraph({ children: collectRunsInto(el), heading: HeadingLevel.HEADING_1 })];
  }
  if (tag === 'h2') {
    return [new Paragraph({ children: collectRunsInto(el), heading: HeadingLevel.HEADING_2 })];
  }
  if (tag === 'h3') {
    return [new Paragraph({ children: collectRunsInto(el), heading: HeadingLevel.HEADING_3 })];
  }
  if (tag === 'blockquote') {
    return [
      new Paragraph({
        children: collectRunsInto(el),
        indent: { left: convertMillimetersToTwip(12) },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: '888888', space: 8 } },
      }),
    ];
  }
  if (tag === 'hr') {
    return [new Paragraph({ text: '', spacing: { before: 200, after: 200 } })];
  }
  if (tag === 'ul' || tag === 'ol') {
    const ref = tag === 'ul' ? 'bullets' : 'numbers';
    const result: Paragraph[] = [];
    const items = Array.from(el.children).filter((c) => c.tagName === 'LI');
    items.forEach((li, i) => {
      const liEl = li as HTMLElement;
      const nested = Array.from(liEl.children).filter((c) => c.tagName === 'UL' || c.tagName === 'OL');
      const direct = Array.from(liEl.children).filter((c) => c.tagName === 'P' || c.tagName === 'DIV');
      const itemEls = direct.length ? direct : [liEl];
      for (const itemEl of itemEls) result.push(paragraphFromEl(itemEl as HTMLElement, ref, 0));
      for (const n of nested) {
        result.push(...blockFromEl(n as HTMLElement));
      }
      void i;
    });
    return result;
  }
  if (tag === 'table') {
    return tableFromEl(el);
  }
  return [paragraphFromEl(el)];
}

function collectRunsInto(el: HTMLElement): RunChild[] {
  const out: RunChild[] = [];
  collectRuns(el, {}, out);
  return out;
}

function tableFromEl(el: HTMLElement): Paragraph[] {
  const rows = Array.from(el.querySelectorAll(':scope > tbody > tr, :scope > tr'));
  const tableRows = rows.map((tr) => {
    const cells = Array.from(tr.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH');
    const children = cells.map((td) => {
      const p = contentParagraphs(td);
      return new TableCell({ children: p });
    });
    return new TableRow({ children });
  });
  if (!tableRows.length) return [];
  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
  return [new Paragraph({ children: [table] })];
}

export async function htmlToDocxBase64(html: string, doc: DocumentState): Promise<string> {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const children: (Paragraph | Table)[] = [];
  for (const el of Array.from(dom.body.children)) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll(':scope > tbody > tr, :scope > tr'));
      const tableRows = rows.map((tr) => {
        const cells = Array.from(tr.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH');
        const cellChildren = cells.map((td) => {
          const paragraphs = contentParagraphs(td as HTMLElement);
          const isHeader = td.tagName === 'TH';
          return new TableCell({
            children: paragraphs,
            shading: isHeader ? { fill: 'E8ECF4' } : undefined,
          });
        });
        return new TableRow({ children: cellChildren });
      });
      if (tableRows.length) children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      continue;
    }
    children.push(...blockFromEl(el as HTMLElement));
  }

  const { margins, size, orientation } = doc.page;
  const mmToTwip = convertMillimetersToTwip;
  const isLandscape = orientation === 'landscape';
  const sizeMap: Record<string, { width: number; height: number }> = {
    A4: { width: 11906, height: 16838 },
    Letter: { width: 12240, height: 15840 },
    A5: { width: 8391, height: 11906 },
  };
  const s = sizeMap[size];
  const width = isLandscape ? s.height : s.width;
  const height = isLandscape ? s.width : s.height;

  const hfRuns = (hf: DocumentState['header']): TextRun[] => {
    const runs: TextRun[] = [];
    if (hf.text) runs.push(new TextRun({ text: hf.text, size: 16, color: '6B7280' }));
    if (hf.pageNumber) {
      if (runs.length) runs.push(new TextRun({ text: '  ·  ', size: 16, color: '9CA3AF' }));
      runs.push(new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '6B7280' }));
    }
    return runs;
  };

  const hfParagraph = (runs: TextRun[]): Paragraph =>
    new Paragraph({
      children: runs,
      alignment:
        doc.header.align === 'center'
          ? AlignmentType.CENTER
          : doc.header.align === 'right'
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT,
    });

  const sectionProps: Record<string, unknown> = {
    page: {
      size: { width, height, orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
      margin: {
        top: mmToTwip(margins.top),
        bottom: mmToTwip(margins.bottom),
        left: mmToTwip(margins.left),
        right: mmToTwip(margins.right),
      },
    },
  };
  if (doc.header.enabled && hfRuns(doc.header).length) {
    sectionProps.header = { default: new Header({ children: [hfParagraph(hfRuns(doc.header))] }) };
  }
  if (doc.footer.enabled && hfRuns(doc.footer).length) {
    sectionProps.footer = { default: new Footer({ children: [hfParagraph(hfRuns(doc.footer))] }) };
  }

  const document = new Document({
    numbering,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '1F2937' },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 40, bold: true, color: '111827', font: 'Calibri' },
          paragraph: { spacing: { before: 280, after: 140 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, color: '1F2937', font: 'Calibri' },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, color: '374151', font: 'Calibri' },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      ],
    },
    sections: [
      {
        properties: sectionProps,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function htmlToDocxBase64Filled(html: string, doc: DocumentState, values: Record<string, string>): Promise<string> {
  return htmlToDocxBase64(fillTemplateFields(html, values), doc);
}
