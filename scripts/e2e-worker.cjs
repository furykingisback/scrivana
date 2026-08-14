const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { PDFDocument, StandardFonts } = require('pdf-lib-with-encrypt');

const pdf = require('../dist-electron/main/pdf.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-wtest-'));
const makePdf = async (file, text) => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 2; i++) {
    const page = doc.addPage();
    page.drawText(`${text} - sayfa ${i + 1}`, { x: 72, y: 720, size: 18, font });
  }
  fs.writeFileSync(file, await doc.save());
};

app.whenReady().then(async () => {
  try {
    const a = path.join(tmp, 'a.pdf');
    const b = path.join(tmp, 'b.pdf');
    await makePdf(a, 'Birinci');
    await makePdf(b, 'Ikinci');

    const count = await pdf.pdfPageCount(a);
    console.log('pageCount(A) =', count, count === 2 ? 'OK' : 'FAIL');

    const mergedPath = path.join(tmp, 'merged.pdf');
    const m = await pdf.mergePdfs([a, b], mergedPath);
    console.log('merge =', m.message, fs.existsSync(mergedPath) ? 'OK' : 'FAIL');

    const outDir = path.join(tmp, 'parts');
    fs.mkdirSync(outDir);
    const s = await pdf.splitPdf(mergedPath, ['1-2', '3'], outDir);
    console.log('split =', s.message, s.outputs?.length === 2 ? 'OK' : 'FAIL');

    const encPath = path.join(tmp, 'enc.pdf');
    const e = await pdf.encryptPdf(a, encPath, 'gizli123');
    console.log('encrypt =', e.message, e.ok ? 'OK' : 'FAIL');

    const decPath = path.join(tmp, 'dec.pdf');
    const d = await pdf.decryptPdf(encPath, decPath, 'gizli123');
    console.log('decrypt =', d.message, d.ok ? 'OK' : 'FAIL');

    const wmPath = path.join(tmp, 'wm.pdf');
    const w = await pdf.watermarkPdf(a, wmPath, { text: 'GİZLİ', fontSize: 40, opacity: 0.3, color: '#ff0000', rotate: 45, repeat: true });
    console.log('watermark =', w.message, w.ok ? 'OK' : 'FAIL');

    const ext = await pdf.extractPdfText(a);
    console.log('extract =', ext.message, ext.ok && ext.pages?.length === 2 ? 'OK' : 'FAIL');

    const wordPath = path.join(tmp, 'cikti.docx');
    const tw = await pdf.pdfToWord(a, wordPath);
    console.log('pdfToWord =', tw.message, fs.existsSync(wordPath) ? 'OK' : 'FAIL');

    console.log('TMPDIR=' + tmp);
    app.exit(0);
  } catch (err) {
    console.error('TEST_FAIL', err);
    app.exit(1);
  }
});
