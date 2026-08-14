import { test, _electron as electron } from '@playwright/test';
import * as path from 'path';

const root = path.resolve(__dirname, '../..');
const exe = path.join(root, 'release', 'win-unpacked', 'Scrivana PDF & Word Studio.exe');
const outDir = path.join(root, 'screenshots');

test('arayüz ekran görüntüleri', async () => {
  test.setTimeout(180000);
  const app = await electron.launch({
    executablePath: exe,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const win = await app.firstWindow();
  await win.waitForSelector('.ak-editor', { timeout: 30_000 });

  await win.locator('.ak-editor .ProseMirror').click();
  await win.keyboard.press('Control+a');
  await win.keyboard.insertText('Scrivana ile Tanışın');
  await win.keyboard.press('Enter');
  await win.keyboard.press('Control+b');
  await win.keyboard.insertText('Tüm işlemler tamamen yerel çalışır; dosyalarınız bilgisayarınızdan çıkmaz.');
  await win.keyboard.press('Control+b');
  await win.keyboard.press('Enter');
  await win.keyboard.insertText('Word seviyesinde kelime işlemci ve Adobe seviyesinde PDF yönetimi — ücretsiz ve açık kaynak.');
  await win.waitForTimeout(400);
  await win.screenshot({ path: path.join(outDir, '1-editor.png') });

  await win.keyboard.press('Control+e');
  await win.waitForSelector('text=PDF Araçları', { timeout: 30_000 });
  await win.waitForTimeout(400);
  await win.screenshot({ path: path.join(outDir, '2-pdf-tools.png') });

  await win.keyboard.press('Control+Shift+p');
  await win.waitForSelector('text=PDF Düzenle', { timeout: 30_000 });
  await win.waitForTimeout(400);
  await win.screenshot({ path: path.join(outDir, '3-pdf-editor.png') });

  await win.keyboard.press('Control+Shift+k');
  await win.waitForSelector('text=Sayfa Küçük Resimleri', { timeout: 30_000 });
  await win.waitForTimeout(400);
  await win.screenshot({ path: path.join(outDir, '4-thumbnails.png') });

  await app.close();
});
