import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib-with-encrypt';
import * as fontkit from '@pdf-lib/fontkit';
import {
  parsePageRanges,
  pdfPageCount,
  mergePdfs,
  splitPdf,
  encryptPdf,
  decryptPdf,
  watermarkPdf,
  extractPdfText,
  pdfToWord,
  pdfRebuildPdf,
  pdfEditText,
  pdfRedact,
  pdfOcr,
  pdfCompress,
  pdfPageNumbers,
  pdfHeaderFooter,
  pdfOrganize,
  pdfPageSize,
  pdfBackground,
  pdfListFormFields,
  pdfFillForm,
  pdfSign,
  pdfExportImages,
  imagesToPdf,
  pdfGetMetadata,
  pdfSetMetadata,
  pdfBatesNumbering,
  pdfPermissions,
  pdfAddFormField,
  pdfAttachFile,
  pdfSetBookmarks,
  redactContentStream,
  transliterate,
  PAGE_SIZES_PT,
  pdfImportAsVisualHtml,
} from '../main/pdfOps';

let tmpDir: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-test-'));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function makePdf(file: string, label: string, pages = 2): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage();
    page.drawText(`${label} page ${i + 1}`, { x: 72, y: 720, size: 18, font });
  }
  fs.writeFileSync(file, await doc.save());
}

function tmp(name: string): string {
  return path.join(tmpDir, name);
}

describe('parsePageRanges', () => {
  it('tek sayfaları ve aralıkları ayrıştırır', () => {
    expect(parsePageRanges(['1-3, 5', '7', '8-6'])).toEqual([
      [1, 2, 3, 5],
      [7],
      [6, 7, 8],
    ]);
  });
  it('geçersiz girdide boş dizi döner', () => {
    expect(parsePageRanges([])).toEqual([]);
    expect(parsePageRanges(['abc', 'x-y'])).toEqual([]);
  });
});

describe('pdfPageCount', () => {
  it('sayfa sayısını döndürür', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    expect(await pdfPageCount(f)).toBe(2);
  });
});

describe('mergePdfs', () => {
  it('iki dosyayı birleştirir', async () => {
    const a = tmp('a.pdf');
    const b = tmp('b.pdf');
    await makePdf(a, 'A');
    await makePdf(b, 'B');
    const out = tmp('merged.pdf');
    const res = await mergePdfs([a, b], out);
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    expect(await pdfPageCount(out)).toBe(4);
  });
  it('var olmayan dosyada hata döndürür', async () => {
    const res = await mergePdfs([tmp('yok.pdf'), tmp('yok2.pdf')], tmp('bad.pdf'));
    expect(res.ok).toBe(false);
  });
});

describe('splitPdf', () => {
  it('sayfa aralıklarına göre böler', async () => {
    const f = tmp('merge4.pdf');
    await makePdf(f, 'M', 4);
    const outDir = path.join(tmpDir, 'parts');
    fs.mkdirSync(outDir, { recursive: true });
    const res = await splitPdf(f, ['1-2', '3-4'], outDir);
    expect(res.ok).toBe(true);
    expect(res.outputs?.length).toBe(2);
    for (const o of res.outputs ?? []) expect(fs.existsSync(o)).toBe(true);
  });
  it('sınır dışı sayfada hata döndürür', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    const res = await splitPdf(f, ['99-100'], tmpDir);
    expect(res.ok).toBe(false);
  });
});

describe('encrypt/decrypt', () => {
  it('şifreler ve doğru şifreyle açar', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    const enc = tmp('enc.pdf');
    const e = await encryptPdf(f, enc, 'gizli123');
    expect(e.ok).toBe(true);
    const dec = tmp('dec.pdf');
    const d = await decryptPdf(enc, dec, 'gizli123');
    expect(d.ok).toBe(true);
    expect(fs.existsSync(dec)).toBe(true);
  });
  it('yanlış şifreyle açamaz', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    const enc = tmp('enc2.pdf');
    await encryptPdf(f, enc, 'dogru123');
    const d = await decryptPdf(enc, tmp('dec2.pdf'), 'yanlis123');
    expect(d.ok).toBe(false);
  });
  it('boş şifre reddedilir', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    const e = await encryptPdf(f, tmp('enc3.pdf'), '');
    expect(e.ok).toBe(false);
  });
});

describe('watermarkPdf', () => {
  it('filigran uygular', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'A');
    const out = tmp('wm.pdf');
    const res = await watermarkPdf(f, out, { text: 'GİZLİ', fontSize: 40, opacity: 0.3, color: '#ff0000', rotate: 45, repeat: true });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('GİZLİ');
  });
});

describe('extractPdfText', () => {
  it('sayfa metinlerini çıkarır', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'Merhaba');
    const res = await extractPdfText(f);
    expect(res.ok).toBe(true);
    expect(res.pages?.length).toBe(2);
    expect(res.pages?.[0]).toContain('Merhaba');
  });
});

describe('pdfToWord', () => {
  it('docx dosyası üretir', async () => {
    const f = tmp('a.pdf');
    await makePdf(f, 'Rapor');
    const out = tmp('cikti.docx');
    const res = await pdfToWord(f, out);
    expect(res.ok).toBe(true);
    const head = fs.readFileSync(out).subarray(0, 2).toString();
    expect(head).toBe('PK');
  });
});

describe('transliterate', () => {
  it('Türkçe karakterleri WinAnsi güvenli hale getirir', () => {
    expect(transliterate('İĞİŞÜÖÇıişgüöç')).toBe('IGISUOCiisguoc');
  });
});

describe('pdfRebuildPdf', () => {
  it('sıralama, silme, çoğaltma ve döndürmeyi uygular', async () => {
    const a = tmp('rebuild-a.pdf');
    await makePdf(a, 'A', 3);
    const out = tmp('rebuilt.pdf');
    const res = await pdfRebuildPdf(
      [a],
      out,
      [
        { file: 0, page: 3 },
        { file: 0, page: 1, rotation: 90 },
        { file: 0, page: 1 },
        { file: 0, page: 1 },
      ],
    );
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const doc = await PDFDocument.load(fs.readFileSync(out), { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(4);
    expect(doc.getPage(1).getRotation().angle).toBe(90);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
  });

  it('birden çok dosyadan sayfa ekler', async () => {
    const a = tmp('rb-a.pdf');
    const b = tmp('rb-b.pdf');
    await makePdf(a, 'A', 2);
    await makePdf(b, 'B', 2);
    const out = tmp('rb-multi.pdf');
    const res = await pdfRebuildPdf([a, b], out, [
      { file: 0, page: 1 },
      { file: 1, page: 2 },
      { file: 0, page: 2 },
    ]);
    expect(res.ok).toBe(true);
    expect(await pdfPageCount(out)).toBe(3);
  });

  it('metin ve vurgu anotasyonlarını basar', async () => {
    const a = tmp('rb-ann.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('rb-annotated.pdf');
    const res = await pdfRebuildPdf(
      [a],
      out,
      [
        {
          file: 0,
          page: 1,
          annotations: [
            { type: 'highlight', x: 50, y: 100, width: 200, height: 24, color: '#FFEB3B' },
            { type: 'text', x: 50, y: 130, width: 200, height: 20, text: 'İmza SÜRE', fontSize: 14, color: '#111827' },
          ],
        },
      ],
    );
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });

  it('geçersiz sayfa numarasında hata döndürür', async () => {
    const a = tmp('rb-bad.pdf');
    await makePdf(a, 'A', 2);
    const res = await pdfRebuildPdf([a], tmp('rb-bad-out.pdf'), [{ file: 0, page: 99 }]);
    expect(res.ok).toBe(false);
  });

  it('boş sayfa listesinde hata döndürür', async () => {
    const res = await pdfRebuildPdf([tmp('x.pdf')], tmp('rb-empty.pdf'), []);
    expect(res.ok).toBe(false);
  });
});

describe('pdfEditText', () => {
  it('metni kaplayıp yeniden çizer', async () => {
    const a = tmp('et-src.pdf');
    await makePdf(a, 'Eski Rapor');
    const out = tmp('et-out.pdf');
    const res = await pdfEditText(a, out, [
      { page: 1, x: 72, baseline: 720, width: 260, height: 24, text: 'Yeni Rapor' },
    ]);
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('Yeni Rapor');
  });

  it('birden çok sayfada düzenler', async () => {
    const a = tmp('et-multi.pdf');
    await makePdf(a, 'A', 3);
    const out = tmp('et-multi-out.pdf');
    const res = await pdfEditText(a, out, [
      { page: 1, x: 72, baseline: 720, width: 200, height: 24, text: 'Birinci' },
      { page: 3, x: 72, baseline: 720, width: 200, height: 24, text: 'Üçüncü' },
    ]);
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('Birinci');
    expect(text.pages?.[2]).toContain('Üçüncü');
  });

  it('Türkçe karakterleri (İ/ı/ş/ğ/ü/ö/ç) korur', async () => {
    const a = tmp('et-tr.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('et-tr-out.pdf');
    const res = await pdfEditText(a, out, [
      { page: 1, x: 72, baseline: 720, width: 400, height: 24, text: 'İğne ışıltısı Şuğa Ünüççö' },
    ]);
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('İğne ışıltısı Şuğa Ünüççö');
  });

  it('geçersiz sayfada hata döndürür', async () => {
    const a = tmp('et-bad.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfEditText(a, tmp('et-bad-out.pdf'), [{ page: 5, x: 0, baseline: 0, width: 10, height: 10, text: 'x' }]);
    expect(res.ok).toBe(false);
  });

  it('boş düzenlemede hata döndürür', async () => {
    const res = await pdfEditText(tmp('et-none.pdf'), tmp('et-none-out.pdf'), []);
    expect(res.ok).toBe(false);
  });
});

describe('redactContentStream', () => {
  const CONTENT = 'q\nBT /F1 18 Tf 72 720 Td (A page 1) Tj ET\nQ';
  it('metin operatörünü kutudan çıkarır ve döner', () => {
    const { content, removed } = redactContentStream(CONTENT, 792, [{ x: 60, y: 50, width: 400, height: 40 }]);
    expect(removed).toBe(1);
    expect(content).not.toContain('Tj');
  });
  it('kutu dışındaki metne dokunmaz', () => {
    const { content, removed } = redactContentStream(CONTENT, 792, [{ x: 400, y: 400, width: 40, height: 40 }]);
    expect(removed).toBe(0);
    expect(content).toContain('Tj');
  });
  it('TJ dizilerini de kaldırır', () => {
    const content = 'BT /F1 12 Tf 72 720 Td [(A page) 5 ( 1)] TJ ET';
    const { content: out, removed } = redactContentStream(content, 792, [{ x: 60, y: 50, width: 400, height: 40 }]);
    expect(removed).toBe(1);
    expect(out).not.toContain('TJ');
  });
});

describe('pdfRedact', () => {
  it('alan içindeki metni siler ve çıktıyı üretir', async () => {
    const a = tmp('rd-src.pdf');
    await makePdf(a, 'Gizli Rapor');
    const out = tmp('rd-out.pdf');
    const res = await pdfRedact(a, out, [{ page: 1, x: 60, y: 90, width: 400, height: 50 }]);
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).not.toContain('Gizli Rapor');
  });
  it('boş redaksiyonda hata döndürür', async () => {
    const a = tmp('rd-empty.pdf');
    await makePdf(a, 'A');
    const res = await pdfRedact(a, tmp('rd-empty-out.pdf'), []);
    expect(res.ok).toBe(false);
  });
  it('geçersiz sayfada hata döndürür', async () => {
    const a = tmp('rd-bad.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfRedact(a, tmp('rd-bad-out.pdf'), [{ page: 9, x: 0, y: 0, width: 10, height: 10 }]);
    expect(res.ok).toBe(false);
  });
  it('kutunun dışındaki metni korur', async () => {
    const a = tmp('rd-keep.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('rd-keep-out.pdf');
    const res = await pdfRedact(a, out, [{ page: 1, x: 400, y: 400, width: 30, height: 30 }]);
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('A page 1');
  });
});

describe('pdfOcr', () => {
  async function makeEmbeddedPdf(file: string, label: string): Promise<void> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(
      fs.readFileSync(path.join(__dirname, '..', 'assets', 'fonts', 'LiberationSans-Regular.ttf')),
    );
    const page = doc.addPage();
    page.drawText(label, { x: 72, y: 720, size: 24, font });
    fs.writeFileSync(file, await doc.save());
  }

  it('taranmış PDF\'den aranabilir metin üretir', async () => {
    const a = tmp('ocr-src.pdf');
    await makeEmbeddedPdf(a, 'Hello World');
    const out = tmp('ocr-out.pdf');
    const res = await pdfOcr(a, out, { language: 'eng' });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const text = await extractPdfText(out);
    expect(text.ok).toBe(true);
    expect(text.pages?.[0] ?? '').toContain('Hello');
  }, 120000);
});

describe('pdfCompress', () => {
  it('büyük görselleri küçültür ve boyutu düşürür', async () => {
    const { createCanvas } = await import('@napi-rs/canvas');
    const a = tmp('cmp-src.pdf');
    const canvas = createCanvas(1500, 2000);
    canvas.getContext('2d').fillRect(0, 0, 1500, 2000);
    const doc = await PDFDocument.create();
    const img = await doc.embedPng(canvas.toBuffer('image/png'));
    const page = doc.addPage([1500, 2000]);
    page.drawImage(img, { x: 0, y: 0, width: 1500, height: 2000 });
    fs.writeFileSync(a, await doc.save());
    const origSize = fs.statSync(a).size;
    const out = tmp('cmp-out.pdf');
    const res = await pdfCompress(a, out, { quality: 0.5 });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    expect(fs.statSync(out).size).toBeLessThan(origSize);
  });
});

describe('pdfPageNumbers', () => {
  it('sayfa numyası ekler ve metinde görünür', async () => {
    const a = tmp('pn-src.pdf');
    await makePdf(a, 'A', 3);
    const out = tmp('pn-out.pdf');
    const res = await pdfPageNumbers(a, out, { start: 1, position: 'bottom-center', format: '{n}/{total}' });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0] ?? '').toContain('1/3');
    expect(text.pages?.[2] ?? '').toContain('3/3');
  });
  it('başlangıç numarasını uygular', async () => {
    const a = tmp('pn-src2.pdf');
    await makePdf(a, 'A', 2);
    const out = tmp('pn-out2.pdf');
    const res = await pdfPageNumbers(a, out, { start: 5 });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0] ?? '').toContain('5');
    expect(text.pages?.[1] ?? '').toContain('6');
  });
});

describe('pdfHeaderFooter', () => {
  it('üst ve alt bilgi ekler', async () => {
    const a = tmp('hf-src.pdf');
    await makePdf(a, 'A', 2);
    const out = tmp('hf-out.pdf');
    const res = await pdfHeaderFooter(a, out, { header: 'Başlık', footer: 'Sayfa Altı' });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0] ?? '').toContain('Başlık');
    expect(text.pages?.[0] ?? '').toContain('Sayfa Altı');
  });
  it('boş metinle hata döndürür', async () => {
    const a = tmp('hf-src2.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfHeaderFooter(a, tmp('hf-out2.pdf'), {});
    expect(res.ok).toBe(false);
  });
});

describe('pdfOrganize', () => {
  it('sıralar, siler ve döndürür', async () => {
    const a = tmp('org-src.pdf');
    await makePdf(a, 'A', 4);
    const out = tmp('org-out.pdf');
    const res = await pdfOrganize(a, out, { order: [4, 2], rotate: { '4': 90 } });
    expect(res.ok).toBe(true);
    const doc = await PDFDocument.load(fs.readFileSync(out), { ignoreEncryption: true });
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('A page 4');
    expect(text.pages?.[1]).toContain('A page 2');
  });
  it('geçersiz sayfada hata döndürür', async () => {
    const a = tmp('org-bad.pdf');
    await makePdf(a, 'A', 2);
    const res = await pdfOrganize(a, tmp('org-bad-out.pdf'), { order: [1, 99] });
    expect(res.ok).toBe(false);
  });
  it('boş sayfa listesinde hata döndürür', async () => {
    const a = tmp('org-empty.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfOrganize(a, tmp('org-empty-out.pdf'), { order: [] });
    expect(res.ok).toBe(false);
  });
});

describe('pdfPageSize', () => {
  it('A5 boyutuna çeker', async () => {
    const a = tmp('ps-src.pdf');
    await makePdf(a, 'A');
    const out = tmp('ps-out.pdf');
    const res = await pdfPageSize(a, out, { preset: 'A5' });
    expect(res.ok).toBe(true);
    const doc = await PDFDocument.load(fs.readFileSync(out), { ignoreEncryption: true });
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(Math.round(PAGE_SIZES_PT.A5.width));
    expect(Math.round(height)).toBe(Math.round(PAGE_SIZES_PT.A5.height));
  });
  it('geçersiz boyutta hata döndürür', async () => {
    const a = tmp('ps-bad.pdf');
    await makePdf(a, 'A');
    const res = await pdfPageSize(a, tmp('ps-bad-out.pdf'), {});
    expect(res.ok).toBe(false);
  });
});

describe('pdfBackground', () => {
  it('renk arka planı ekler ve içeriği korur', async () => {
    const a = tmp('bg-src.pdf');
    await makePdf(a, 'Arka Plan Testi');
    const out = tmp('bg-out.pdf');
    const res = await pdfBackground(a, out, { color: '#f3f4f6', opacity: 1 });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('Arka Plan Testi');
  });
  it('görsel arka planı ekler', async () => {
    const { createCanvas } = await import('@napi-rs/canvas');
    const canvas = createCanvas(24, 24);
    canvas.getContext('2d').fillRect(0, 0, 24, 24);
    const png = path.join(tmpDir, 'bg-img.png');
    fs.writeFileSync(png, canvas.toBuffer('image/png'));
    const a = tmp('bg-img-src.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('bg-img-out.pdf');
    const res = await pdfBackground(a, out, { imagePath: png, opacity: 0.8 });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });
});

async function makeFormPdf(file: string): Promise<void> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(path.join(__dirname, '..', 'assets', 'fonts', 'LiberationSans-Regular.ttf'));
  const font = await doc.embedFont(fontBytes);
  const page = doc.addPage();
  const form = doc.getForm();
  const nameField = form.createTextField('adsoyad');
  nameField.setText('Varsayilan Ad');
  nameField.addToPage(page, { x: 50, y: 700, width: 200, height: 30, font });
  const cb = form.createCheckBox('kabul');
  cb.addToPage(page, { x: 50, y: 650, width: 20, height: 20 });
  const dd = form.createDropdown('sehir');
  dd.addOptions(['Istanbul', 'Ankara', 'Izmir']);
  dd.addToPage(page, { x: 50, y: 600, width: 200, height: 30, font });
  const radio = form.createRadioGroup('cinsiyet');
  radio.addOptionToPage('Erkek', page, { x: 50, y: 550, width: 20, height: 20 });
  radio.addOptionToPage('Kadin', page, { x: 120, y: 550, width: 20, height: 20 });
  fs.writeFileSync(file, await doc.save());
}

describe('pdfListFormFields', () => {
  it('form alanlarını türleriyle listeler', async () => {
    const a = tmp('ff-src.pdf');
    await makeFormPdf(a);
    const res = await pdfListFormFields(a);
    expect(res.ok).toBe(true);
    expect(res.fields?.some((f) => f.name === 'adsoyad' && f.type === 'text' && f.value === 'Varsayilan Ad')).toBe(true);
    expect(res.fields?.some((f) => f.name === 'kabul' && f.type === 'checkbox')).toBe(true);
    expect(res.fields?.some((f) => f.name === 'sehir' && f.type === 'dropdown' && f.options?.includes('Istanbul'))).toBe(true);
    expect(res.fields?.some((f) => f.name === 'cinsiyet' && f.type === 'radio' && f.options?.length === 2)).toBe(true);
  });
});

describe('pdfFillForm', () => {
  it('alanları doldurur ve düzleştirir', async () => {
    const a = tmp('ff-fill-src.pdf');
    await makeFormPdf(a);
    const out = tmp('ff-fill-out.pdf');
    const res = await pdfFillForm(a, out, { values: { adsoyad: 'Ayse Yilmaz', kabul: 'on', sehir: 'Izmir', cinsiyet: 'Kadin' }, flatten: true });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
    const listed = await pdfListFormFields(out);
    expect(listed.fields?.length ?? 0).toBe(0);
  });
  it('boş değerde hata döndürür', async () => {
    const a = tmp('ff-empty-src.pdf');
    await makeFormPdf(a);
    const res = await pdfFillForm(a, tmp('ff-empty-out.pdf'), { values: {} });
    expect(res.ok).toBe(false);
  });
  it('alanla eşleşmeyen değerde hata döndürür', async () => {
    const a = tmp('ff-nomatch-src.pdf');
    await makeFormPdf(a);
    const res = await pdfFillForm(a, tmp('ff-nomatch-out.pdf'), { values: { olmayan: 'x' } });
    expect(res.ok).toBe(false);
  });
});

describe('pdfSign', () => {
  it('metin imza ekler', async () => {
    const a = tmp('sg-src.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('sg-out.pdf');
    const res = await pdfSign(a, out, { page: 1, text: 'Ayşe Yılmaz', position: 'bottom-right' });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('Ayşe Yılmaz');
  });
  it('görsel imza ekler', async () => {
    const { createCanvas } = await import('@napi-rs/canvas');
    const canvas = createCanvas(40, 20);
    canvas.getContext('2d').fillRect(0, 0, 40, 20);
    const png = path.join(tmpDir, 'sign.png');
    fs.writeFileSync(png, canvas.toBuffer('image/png'));
    const a = tmp('sg-img-src.pdf');
    await makePdf(a, 'A', 1);
    const out = tmp('sg-img-out.pdf');
    const res = await pdfSign(a, out, { page: 1, imagePath: png });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });
  it('geçersiz sayfada hata döndürür', async () => {
    const a = tmp('sg-bad.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfSign(a, tmp('sg-bad-out.pdf'), { page: 5, text: 'x' });
    expect(res.ok).toBe(false);
  });
  it('metin ve görsel yoksa hata döndürür', async () => {
    const a = tmp('sg-none.pdf');
    await makePdf(a, 'A', 1);
    const res = await pdfSign(a, tmp('sg-none-out.pdf'), { page: 1 });
    expect(res.ok).toBe(false);
  });
});

describe('pdfExportImages & imagesToPdf', () => {
  it('sayfaları görsel olarak dışa aktarır ve tekrar PDF yapar', async () => {
    const a = tmp('img-src.pdf');
    await makePdf(a, 'Img Test', 2);
    const outDir = path.join(tmpDir, 'exported-imgs');
    const res = await pdfExportImages(a, outDir, { format: 'png', scale: 1 });
    expect(res.ok).toBe(true);
    expect(res.outputs?.length).toBe(2);
    for (const p of res.outputs ?? []) expect(fs.existsSync(p)).toBe(true);

    const pdfOut = tmp('re-images.pdf');
    const res2 = await imagesToPdf(res.outputs ?? [], pdfOut);
    expect(res2.ok).toBe(true);
    expect(fs.existsSync(pdfOut)).toBe(true);
    expect(await pdfPageCount(pdfOut)).toBe(2);
  });
  it('boş listede hata döndürür', async () => {
    const res = await imagesToPdf([], tmp('empty.pdf'));
    expect(res.ok).toBe(false);
  });
});

describe('pdfImportAsVisualHtml', () => {
  it('çok sayfalı PDF sayfa görsellerini HTML olarak içe aktarır', async () => {
    const a = tmp('visual-src.pdf');
    await makePdf(a, 'Visual', 3);
    const res = await pdfImportAsVisualHtml(a);
    expect(res.ok).toBe(true);
    expect(res.numPages).toBe(3);
    expect(res.html).toContain('data:image/png;base64,');
    expect(res.html).toContain('Sayfa 1');
    expect(res.html).toContain('Sayfa 3');
  });

  it('alfa kanallı görsel içeren PDF render edilir (offscreen tuval)', async () => {
    const { createCanvas } = await import('@napi-rs/canvas');
    const c = createCanvas(120, 120);
    const ctx = c.getContext('2d');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, 100, 100);
    const doc = await PDFDocument.create();
    const png = await doc.embedPng(c.toBuffer('image/png'));
    const page = doc.addPage([240, 240]);
    page.drawImage(png, { x: 60, y: 60, width: 120, height: 120 });
    const a = tmp('visual-alpha.pdf');
    fs.writeFileSync(a, await doc.save());
    const res = await pdfImportAsVisualHtml(a);
    expect(res.ok).toBe(true);
    expect(res.html).toContain('data:image/png;base64,');
  });
});

describe('pdfGetMetadata & pdfSetMetadata', () => {
  it('meta verileri okur ve günceller', async () => {
    const a = tmp('meta-src.pdf');
    await makePdf(a, 'Meta', 1);
    const out = tmp('meta-out.pdf');
    const resSet = await pdfSetMetadata(a, out, {
      title: 'Test Raporu',
      author: 'Mustafa',
      subject: 'Mali Analiz',
      keywords: ['rapor', '2026'],
    });
    expect(resSet.ok).toBe(true);

    const resGet = await pdfGetMetadata(out);
    expect(resGet.ok).toBe(true);
    expect(resGet.metadata?.title).toBe('Test Raporu');
    expect(resGet.metadata?.author).toBe('Mustafa');
    expect(resGet.metadata?.subject).toBe('Mali Analiz');
    expect(resGet.metadata?.keywords).toEqual(['rapor', '2026']);
  });
});

describe('pdfBatesNumbering', () => {
  it('bates seri numarası ekler', async () => {
    const a = tmp('bates-src.pdf');
    await makePdf(a, 'Bates', 2);
    const out = tmp('bates-out.pdf');
    const res = await pdfBatesNumbering(a, out, { prefix: 'LEGAL-', start: 10, digits: 4 });
    expect(res.ok).toBe(true);
    const text = await extractPdfText(out);
    expect(text.pages?.[0]).toContain('LEGAL-0010');
    expect(text.pages?.[1]).toContain('LEGAL-0011');
  });
});

describe('pdfPermissions', () => {
  it('güvenlik kısıtlamaları uygular', async () => {
    const a = tmp('perm-src.pdf');
    await makePdf(a, 'Perm', 1);
    const out = tmp('perm-out.pdf');
    const res = await pdfPermissions(a, out, { printing: 'none', copying: false });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });
});

describe('pdfAddFormField', () => {
  it('sayfaya yeni form alanı ekler', async () => {
    const a = tmp('addfield-src.pdf');
    await makePdf(a, 'Form', 1);
    const out = tmp('addfield-out.pdf');
    const res = await pdfAddFormField(a, out, { page: 1, type: 'text', name: 'tc_no', defaultValue: '12345678901' });
    expect(res.ok).toBe(true);
    const fields = await pdfListFormFields(out);
    expect(fields.fields?.some((f) => f.name === 'tc_no' && f.value === '12345678901')).toBe(true);
  });
});

describe('pdfAttachFile', () => {
  it('dosya ekler', async () => {
    const a = tmp('attach-src.pdf');
    await makePdf(a, 'Attach', 1);
    const att = tmp('sample.txt');
    fs.writeFileSync(att, 'Hello attachment');
    const out = tmp('attach-out.pdf');
    const res = await pdfAttachFile(a, out, { filePath: att, description: 'Örnek Ek' });
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });
});

describe('pdfSetBookmarks', () => {
  it('yer imleri ekler', async () => {
    const a = tmp('bm-src.pdf');
    await makePdf(a, 'Bookmarks', 3);
    const out = tmp('bm-out.pdf');
    const res = await pdfSetBookmarks(a, out, [
      { title: 'Giriş', page: 1 },
      { title: 'Gelişme', page: 2 },
    ]);
    expect(res.ok).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });
});
