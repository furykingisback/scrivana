import { test, expect, _electron as electron } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib-with-encrypt';

const root = path.resolve(__dirname, '../..');
const mainEntry = path.join(root, 'dist-electron', 'main', 'index.js');

async function launchApp() {
  const app = await electron.launch({
    args: [mainEntry],
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const win = await app.firstWindow();
  win.on('console', (m) => console.log('[renderer]', m.type(), m.text()));
  win.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await win.waitForSelector('.ak-editor', { timeout: 30_000 });
  return { app, win };
}

test.describe('Scrivana smoke', () => {
  test('uygulama açılır ve editör çalışır', async () => {
    const { app, win } = await launchApp();
    try {
      await expect(win.locator('.ak-editor').first()).toBeVisible();
      await win.locator('.ak-editor .ProseMirror').click();
      await win.keyboard.press('Control+a');
      await win.keyboard.type('Merhaba dünya');
      await expect(win.locator('.ak-editor').first()).toContainText('Merhaba dünya');
    } finally {
      await app.close();
    }
  });

  test('komut paleti Ctrl+K ile açılır', async () => {
    const { app, win } = await launchApp();
    try {
      await win.keyboard.press('Control+k');
      await expect(win.locator('.ak-palette')).toBeVisible();
      await win.locator('.ak-palette-input').fill('word');
      await expect(win.locator('.ak-palette')).toContainText('Word (.docx) Olarak Dışa Aktar');
    } finally {
      await app.close();
    }
  });

  test('sayfa küçük resimleri paneli açılır ve önizleme üretilir', async () => {
    const { app, win } = await launchApp();
    try {
      await win.locator('.ak-editor .ProseMirror').click();
      await win.keyboard.press('Control+a');
      await win.keyboard.type('Önizleme metni');
      await win.keyboard.press('Control+Shift+k');
      await expect(win.getByText('Sayfa Küçük Resimleri')).toBeVisible();
      await expect(win.locator('img[alt="1. sayfa"]').first()).toBeVisible({ timeout: 30_000 });
    } finally {
      await app.close();
    }
  });

  test('şablon alanı tespit edilir ve modal açılır', async () => {
    const { app, win } = await launchApp();
    try {
      await win.locator('.ak-editor .ProseMirror').click();
      await win.keyboard.press('Control+a');
      await win.keyboard.type('Sayın {{isim}}, işleminiz tamamlandı.');
      await win.keyboard.press('Control+k');
      await win.locator('.ak-palette-input').fill('şablon');
      await win.getByRole('button', { name: 'Word Şablonuyla Dışa Aktar' }).click();
      await expect(win.getByText('Word Şablonu — Alan Değerleri')).toBeVisible();
      await expect(win.getByText('isim', { exact: true })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('PDF araçları paneli açılır', async () => {
    const { app, win } = await launchApp();
    try {
      await win.keyboard.press('Control+e');
      await expect(win.getByText('PDF Araçları', { exact: true }).first()).toBeVisible();
      await expect(win.getByText('Tüm işlemler tamamen yerel olarak çalışır; dosyalar bilgisayarınızdan çıkmaz.')).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('PDF Düzenle paneli açılır', async () => {
    const { app, win } = await launchApp();
    try {
      await win.keyboard.press('Control+Shift+p');
      await expect(win.getByText('Sayfaları sıralayabilir', { exact: false }).first()).toBeVisible();
      await expect(win.getByRole('button', { name: 'PDF Aç' })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('pdfRebuild worker IPC ile sayfa düzenleme çalışır', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 3; i += 1) {
      const page = doc.addPage();
      page.drawText(`Sayfa ${i + 1}`, { x: 72, y: 720, size: 20, font });
    }
    fs.writeFileSync(src, await doc.save());
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => {
          const r = await window.api.pdfRebuild([srcPath], outPath, [
            { file: 0, page: 2, rotation: 90 },
            { file: 0, page: 1 },
            { file: 0, page: 3 },
            {
              file: 0,
              page: 1,
              annotations: [{ type: 'highlight', x: 50, y: 100, width: 200, height: 24, color: '#FFEB3B' }],
            },
          ]);
          return r;
        },
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      expect(fs.existsSync(out)).toBe(true);
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfEditText worker IPC ile metin düzenleme çalışır', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();
    page.drawText('Eski metin', { x: 72, y: 720, size: 20, font });
    fs.writeFileSync(src, await doc.save());
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => {
          const r = await window.api.pdfEditText(srcPath, outPath, [
            { page: 1, x: 72, baseline: 720, width: 300, height: 24, text: 'Yeni ışık İstanbul' },
          ]);
          return r;
        },
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      expect(fs.existsSync(out)).toBe(true);
      const ops = (await import(path.join(root, 'dist-electron', 'main', 'pdfOps.js'))) as {
        extractPdfText: (p: string) => Promise<{ ok: boolean; pages?: string[] }>;
      };
      const text = await ops.extractPdfText(out);
      expect(text.pages?.[0] ?? '').toContain('Yeni ışık İstanbul');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfOcr worker IPC ile taranabilir PDF üretir', async () => {
    test.setTimeout(120000);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const fontkit = (await import('@pdf-lib/fontkit')).default;
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(fs.readFileSync(path.join(root, 'assets', 'fonts', 'LiberationSans-Regular.ttf')));
    const page = doc.addPage();
    page.drawText('Hello World OCR Test', { x: 72, y: 720, size: 24, font });
    fs.writeFileSync(src, await doc.save());
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => {
          const r = await window.api.pdfOcr(srcPath, outPath, { language: 'eng' });
          return r;
        },
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      expect(fs.existsSync(out)).toBe(true);
      const ops = (await import(path.join(root, 'dist-electron', 'main', 'pdfOps.js'))) as {
        extractPdfText: (p: string) => Promise<{ ok: boolean; pages?: string[] }>;
      };
      const text = await ops.extractPdfText(out);
      expect(text.pages?.[0] ?? '').toContain('Hello');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfCompress worker IPC ile boyutu küçültür', async () => {
    test.setTimeout(60000);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const { createCanvas } = await import('@napi-rs/canvas');
    const canvas = createCanvas(1500, 2000);
    canvas.getContext('2d').fillRect(0, 0, 1500, 2000);
    const doc = await PDFDocument.create();
    const img = await doc.embedPng(canvas.toBuffer('image/png'));
    const page = doc.addPage([1500, 2000]);
    page.drawImage(img, { x: 0, y: 0, width: 1500, height: 2000 });
    fs.writeFileSync(src, await doc.save());
    const origSize = fs.statSync(src).size;
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => window.api.pdfCompress(srcPath, outPath, { quality: 0.5 }),
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      expect(fs.existsSync(out)).toBe(true);
      expect(fs.statSync(out).size).toBeLessThan(origSize);
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfPageNumbers worker IPC ile numara ekler', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 3; i += 1) {
      const page = doc.addPage();
      page.drawText(`Sayfa ${i + 1}`, { x: 72, y: 720, size: 20, font });
    }
    fs.writeFileSync(src, await doc.save());
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => window.api.pdfPageNumbers(srcPath, outPath, { start: 1, position: 'bottom-center', format: '{n}/{total}' }),
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      const ops = (await import(path.join(root, 'dist-electron', 'main', 'pdfOps.js'))) as {
        extractPdfText: (p: string) => Promise<{ ok: boolean; pages?: string[] }>;
      };
      const text = await ops.extractPdfText(out);
      expect(text.pages?.[0] ?? '').toContain('1/3');
      expect(text.pages?.[2] ?? '').toContain('3/3');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfHeaderFooter worker IPC ile üst/alt bilgi ekler', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();
    page.drawText('Content', { x: 72, y: 720, size: 20, font });
    fs.writeFileSync(src, await doc.save());
    const { app, win } = await launchApp();
    try {
      const res = await win.evaluate(
        async ({ srcPath, outPath }) => window.api.pdfHeaderFooter(srcPath, outPath, { header: 'Başlık', footer: 'Alt Bilgi' }),
        { srcPath: src, outPath: out },
      );
      expect(res.ok).toBe(true);
      const ops = (await import(path.join(root, 'dist-electron', 'main', 'pdfOps.js'))) as {
        extractPdfText: (p: string) => Promise<{ ok: boolean; pages?: string[] }>;
      };
      const text = await ops.extractPdfText(out);
      expect(text.pages?.[0] ?? '').toContain('Başlık');
      expect(text.pages?.[0] ?? '').toContain('Alt Bilgi');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('pdfRedact UI akışı çalışır (modal, alan çizme, kaydetme)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-'));
    const src = path.join(tmpDir, 'src.pdf');
    const out = path.join(tmpDir, 'out.pdf');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();
    page.drawText('Gizli Rapor page 1', { x: 72, y: 720, size: 18, font });
    fs.writeFileSync(src, await doc.save());

    const { app, win } = await launchApp();
    try {
      await app.evaluate(
        async ({ ipcMain }, payload: { src: string; out: string }) => {
          ipcMain.removeHandler('dialog:openFile');
          ipcMain.handle('dialog:openFile', async () => payload.src);
          ipcMain.removeHandler('dialog:saveFile');
          ipcMain.handle('dialog:saveFile', async () => payload.out);
        },
        { src, out },
      );

      await win.keyboard.press('Control+Shift+p');
      await expect(win.getByRole('button', { name: 'PDF Aç' })).toBeVisible();
      await win.getByRole('button', { name: 'PDF Aç' }).click();
      await expect(win.getByText('Sayfa 1', { exact: false }).first()).toBeVisible({ timeout: 30_000 });

      await win.getByRole('button', { name: 'Redakte Et' }).click();
      const modal = win.locator('div.fixed.inset-0');
      await expect(modal.getByText('Redakte Et', { exact: true })).toBeVisible();
      await expect(win.locator('img[alt="Sayfa"]').first()).toBeVisible({ timeout: 30_000 });
      await expect(win.getByText('0 alan')).toBeVisible();

      const box = win.locator('.cursor-crosshair').first();
      await box.scrollIntoViewIfNeeded();
      const bb = await box.boundingBox();
      expect(bb).not.toBeNull();
      await win.mouse.move(bb!.x + bb!.width * 0.1, bb!.y + bb!.height * 0.12);
      await win.mouse.down();
      await win.mouse.move(bb!.x + bb!.width * 0.9, bb!.y + bb!.height * 0.16, { steps: 8 });
      await win.mouse.up();
      await expect(win.getByText('1 alan')).toBeVisible();

      await modal.getByRole('button', { name: 'Farklı Kaydet' }).click();
      await expect.poll(() => fs.existsSync(out), { timeout: 20_000 }).toBe(true);

      const ops = (await import(path.join(root, 'dist-electron', 'main', 'pdfOps.js'))) as {
        extractPdfText: (p: string) => Promise<{ ok: boolean; pages?: string[] }>;
      };
      const text = await ops.extractPdfText(out);
      expect(text.pages?.[0] ?? '').not.toContain('Gizli Rapor');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

test.describe('Paketli uygulama (asar)', () => {
  const exe = path.join(root, 'release', 'win-unpacked', 'Scrivana PDF & Word Studio.exe');

  test('paketli sürüm açılır ve temel akışlar çalışır', async () => {
    test.skip(!fs.existsSync(exe), 'release/win-unpacked yok — önce npm run dist:win çalıştırın.');
    const app = await electron.launch({
      executablePath: exe,
      env: { ...process.env, NODE_ENV: 'production' },
    });
    const win = await app.firstWindow();
    try {
      await win.waitForSelector('.ak-editor', { timeout: 30_000 });
      await expect(win.locator('.ak-editor .ProseMirror')).toBeVisible();
      await win.locator('.ak-editor .ProseMirror').click();
      await win.keyboard.press('Control+a');
      await win.keyboard.type('Paketli test metni');
      await expect(win.locator('.ak-editor').first()).toContainText('Paketli test metni');
      await win.keyboard.press('Control+Shift+k');
      await expect(win.getByText('Sayfa Küçük Resimleri')).toBeVisible();
      await expect(win.locator('img[alt="1. sayfa"]').first()).toBeVisible({ timeout: 30_000 });
    } finally {
      await app.close();
    }
  });

  test('paketli sürümde PDF görsel içe aktarma çalışır (canvas modülü gerekmez)', async () => {
    test.setTimeout(120000);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-e2e-visual-'));
    const src = path.join(tmpDir, 'visual.pdf');
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
    fs.writeFileSync(src, await doc.save());
    const app = await electron.launch({
      executablePath: exe,
      env: { ...process.env, NODE_ENV: 'production' },
    });
    const win = await app.firstWindow();
    try {
      await win.waitForSelector('.ak-editor', { timeout: 30_000 });
      const res = await win.evaluate(
        async (p: string) => window.api.pdfImportAsVisualHtml(p),
        src,
      );
      expect(res.ok).toBe(true);
      expect(res.html).toContain('data:image/png;base64,');
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
