import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {
  mergePdfs,
  splitPdf,
  encryptPdf,
  decryptPdf,
  watermarkPdf,
  pdfPageCount,
  extractPdfText,
  pdfToWord,
  pdfRebuild,
  readPdfFileBase64,
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
  pdfSmartImportText,
  pdfImportAsVisualHtml,
  htmlToPdf,
  htmlToPdfBuffer,
  HtmlToPdfOptions,
  PdfOperationResult,
} from './pdf';
import {
  loadSession,
  saveSession,
  clearSession,
  loadRecents,
  addRecent,
  removeRecent,
  clearRecents,
  SessionData,
} from './store';

let mainWindow: BrowserWindow | null = null;

const crashLog = (e: unknown) => {
  try {
    fs.appendFileSync(path.join(app.getPath('temp'), 'ak-crash.log'), `[${new Date().toISOString()}] ${(e && (e as Error).stack) || String(e)}\n\n`);
  } catch {
    /* noop */
  }
};
process.on('uncaughtException', (e) => crashLog(e));
process.on('unhandledRejection', (e) => crashLog(e));

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    title: 'Scrivana PDF & Word Studio',
    backgroundColor: '#0b0f14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  try {
    mainWindow.webContents.session.setSpellCheckerLanguages(['tr', 'en-US']);
  } catch {
    /* noop */
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpc(): void {
  ipcMain.handle('dialog:openFiles', async (_e, filters) => {
    const result = await dialog.showOpenDialog(mainWindow as BrowserWindow, {
      title: 'Dosya Seç',
      properties: ['openFile', 'multiSelections'],
      filters,
    });
    return result.canceled ? null : result.filePaths;
  });

  ipcMain.handle('dialog:openFile', async (_e, filters) => {
    const result = await dialog.showOpenDialog(mainWindow as BrowserWindow, {
      title: 'Dosya Seç',
      properties: ['openFile'],
      filters,
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_e, opts: { title?: string; defaultName: string; filters: Electron.FileFilter[] }) => {
    const result = await dialog.showSaveDialog(mainWindow as BrowserWindow, {
      title: opts.title || 'Kaydet',
      defaultPath: path.join(app.getPath('documents'), opts.defaultName),
      filters: opts.filters,
    });
    return result.canceled || !result.filePath ? null : result.filePath;
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow as BrowserWindow, {
      title: 'Klasör Seç',
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('fs:readText', async (_e, p: string) => {
    return fs.promises.readFile(p, 'utf-8');
  });

  ipcMain.handle('fs:readBase64', async (_e, p: string) => {
    const buf = await fs.promises.readFile(p);
    return buf.toString('base64');
  });

  ipcMain.handle('fs:writeText', async (_e, p: string, data: string) => {
    await fs.promises.writeFile(p, data, 'utf-8');
    return { ok: true };
  });

  ipcMain.handle('fs:writeBase64', async (_e, p: string, data: string) => {
    await fs.promises.writeFile(p, Buffer.from(data, 'base64'));
    return { ok: true };
  });

  ipcMain.handle('shell:openPath', async (_e, p: string) => {
    await shell.showItemInFolder(p);
    return true;
  });

  ipcMain.handle('pdf:pageCount', async (_e, p: string) => pdfPageCount(p));
  ipcMain.handle('pdf:extractText', async (_e, p: string) => extractPdfText(p));
  ipcMain.handle('pdf:smartImportText', async (_e, p: string) => pdfSmartImportText(p));
  ipcMain.handle('pdf:importAsVisualHtml', async (_e, p: string) => pdfImportAsVisualHtml(p));
  ipcMain.handle('pdf:toWord', async (_e, inPath: string, outPath: string): Promise<PdfOperationResult> => pdfToWord(inPath, outPath));
  ipcMain.handle(
    'pdf:rebuild',
    async (_e, inputs: string[], outPath: string, pages: unknown[]): Promise<PdfOperationResult> => pdfRebuild(inputs, outPath, pages),
  );
  ipcMain.handle('pdf:readFileBase64', async (_e, filePath: string): Promise<{ ok: boolean; base64?: string; message?: string }> =>
    readPdfFileBase64(filePath),
  );
  ipcMain.handle(
    'pdf:editText',
    async (_e, inPath: string, outPath: string, edits: unknown[]): Promise<PdfOperationResult> => pdfEditText(inPath, outPath, edits),
  );
  ipcMain.handle(
    'pdf:redact',
    async (_e, inPath: string, outPath: string, redactions: unknown[]): Promise<PdfOperationResult> => pdfRedact(inPath, outPath, redactions),
  );
  ipcMain.handle(
    'pdf:ocr',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { language?: string; scale?: number },
    ): Promise<PdfOperationResult> => pdfOcr(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:compress',
    async (_e, inPath: string, outPath: string, opts: { quality?: number }): Promise<PdfOperationResult> =>
      pdfCompress(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:pageNumbers',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { start?: number; position?: string; fontSize?: number; color?: string; format?: string; margin?: number },
    ): Promise<PdfOperationResult> => pdfPageNumbers(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:headerFooter',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { header?: string; footer?: string; fontSize?: number; color?: string; margin?: number },
    ): Promise<PdfOperationResult> => pdfHeaderFooter(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:organize',
    async (_e, inPath: string, outPath: string, opts: { order: number[]; rotate?: Record<string, number> }): Promise<PdfOperationResult> =>
      pdfOrganize(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:pageSize',
    async (_e, inPath: string, outPath: string, opts: { preset?: string; widthPt?: number; heightPt?: number }): Promise<PdfOperationResult> =>
      pdfPageSize(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:background',
    async (_e, inPath: string, outPath: string, opts: { color?: string; opacity?: number; imagePath?: string }): Promise<PdfOperationResult> =>
      pdfBackground(inPath, outPath, opts),
  );
  ipcMain.handle('pdf:listFormFields', async (_e, filePath: string) => pdfListFormFields(filePath));
  ipcMain.handle(
    'pdf:fillForm',
    async (_e, inPath: string, outPath: string, opts: { values: Record<string, string>; flatten?: boolean }): Promise<PdfOperationResult> =>
      pdfFillForm(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:sign',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { page: number; position?: string; text?: string; imagePath?: string; fontSize?: number; color?: string; maxWidth?: number; margin?: number },
    ): Promise<PdfOperationResult> => pdfSign(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:exportImages',
    async (_e, inPath: string, outDir: string, opts: { format?: 'png' | 'jpeg'; scale?: number }) => pdfExportImages(inPath, outDir, opts),
  );
  ipcMain.handle('pdf:imagesToPdf', async (_e, imagePaths: string[], outPath: string) => imagesToPdf(imagePaths, outPath));
  ipcMain.handle('pdf:getMetadata', async (_e, filePath: string) => pdfGetMetadata(filePath));
  ipcMain.handle(
    'pdf:setMetadata',
    async (_e, inPath: string, outPath: string, meta: { title?: string; author?: string; subject?: string; keywords?: string[] }) =>
      pdfSetMetadata(inPath, outPath, meta),
  );
  ipcMain.handle(
    'pdf:batesNumbering',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { prefix?: string; start?: number; digits?: number; position?: string; fontSize?: number; color?: string; margin?: number },
    ): Promise<PdfOperationResult> => pdfBatesNumbering(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:permissions',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { userPassword?: string; ownerPassword?: string; printing?: string; modifying?: boolean; copying?: boolean; annotating?: boolean; documentAssembly?: boolean },
    ): Promise<PdfOperationResult> => pdfPermissions(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:addFormField',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { page?: number; type?: string; name?: string; x?: number; y?: number; width?: number; height?: number; defaultValue?: string; options?: string[] },
    ): Promise<PdfOperationResult> => pdfAddFormField(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:attachFile',
    async (_e, inPath: string, outPath: string, opts: { filePath?: string; description?: string }): Promise<PdfOperationResult> =>
      pdfAttachFile(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:setBookmarks',
    async (_e, inPath: string, outPath: string, bookmarks: { title: string; page: number }[]): Promise<PdfOperationResult> =>
      pdfSetBookmarks(inPath, outPath, bookmarks),
  );

  ipcMain.handle('store:loadSession', async (): Promise<SessionData | null> => loadSession());
  ipcMain.handle('store:saveSession', async (_e, session: SessionData) => {
    saveSession(session);
    return { ok: true };
  });
  ipcMain.handle('store:clearSession', async () => {
    clearSession();
    return { ok: true };
  });

  ipcMain.handle('recents:list', async (): Promise<string[]> => loadRecents());
  ipcMain.handle('recents:add', async (_e, p: string): Promise<string[]> => {
    if (p && typeof p === 'string') {
      app.addRecentDocument(p);
      return addRecent(p);
    }
    return loadRecents();
  });
  ipcMain.handle('recents:remove', async (_e, p: string): Promise<string[]> => removeRecent(p));
  ipcMain.handle('recents:clear', async (): Promise<string[]> => clearRecents());

  ipcMain.handle('pdf:merge', async (_e, paths: string[], outPath: string): Promise<PdfOperationResult> => mergePdfs(paths, outPath));
  ipcMain.handle('pdf:split', async (_e, inPath: string, ranges: string[], outDir: string): Promise<PdfOperationResult> => splitPdf(inPath, ranges, outDir));
  ipcMain.handle('pdf:encrypt', async (_e, inPath: string, outPath: string, password: string): Promise<PdfOperationResult> => encryptPdf(inPath, outPath, password));
  ipcMain.handle('pdf:decrypt', async (_e, inPath: string, outPath: string, password: string): Promise<PdfOperationResult> => decryptPdf(inPath, outPath, password));
  ipcMain.handle(
    'pdf:watermark',
    async (
      _e,
      inPath: string,
      outPath: string,
      opts: { text: string; fontSize: number; opacity: number; color: string; rotate: number; repeat: boolean },
    ): Promise<PdfOperationResult> => watermarkPdf(inPath, outPath, opts),
  );
  ipcMain.handle(
    'pdf:fromHtml',
    async (_e, html: string, outPath: string, opts: HtmlToPdfOptions): Promise<PdfOperationResult> => htmlToPdf(html, outPath, opts),
  );
  ipcMain.handle(
    'pdf:htmlToPdfBase64',
    async (_e, html: string, opts: HtmlToPdfOptions): Promise<{ ok: boolean; base64?: string; message?: string }> => {
      try {
        const data = await htmlToPdfBuffer(html, opts);
        return { ok: true, base64: data.toString('base64') };
      } catch (err) {
        return { ok: false, message: `PDF oluşturma hatası: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  );
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    if (process.env.NODE_ENV === 'production') {
      Menu.setApplicationMenu(null);
    }
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
