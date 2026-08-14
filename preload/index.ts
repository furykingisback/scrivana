import { contextBridge, ipcRenderer } from 'electron';

export interface SessionData {
  docs: unknown[];
  activeId: string;
}

export interface Api {
  openFiles(filters: Electron.FileFilter[]): Promise<string[] | null>;
  openFile(filters: Electron.FileFilter[]): Promise<string | null>;
  saveFile(opts: { title?: string; defaultName: string; filters: Electron.FileFilter[] }): Promise<string | null>;
  openDirectory(): Promise<string | null>;
  readText(p: string): Promise<string>;
  readBase64(p: string): Promise<string>;
  writeText(p: string, data: string): Promise<{ ok: boolean }>;
  writeBase64(p: string, data: string): Promise<{ ok: boolean }>;
  openPath(p: string): Promise<boolean>;
  pdfPageCount(p: string): Promise<number>;
  pdfExtractText(p: string): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }>;
  pdfSmartImportText(p: string): Promise<{ ok: boolean; message: string; pages?: string[]; numPages?: number }>;
  pdfImportAsVisualHtml(p: string): Promise<{ ok: boolean; message: string; html?: string; numPages?: number }>;
  pdfMerge(paths: string[], out: string): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfSplit(inPath: string, ranges: string[], outDir: string): Promise<{ ok: boolean; message: string; outputs?: string[] }>;
  pdfEncrypt(inPath: string, out: string, password: string): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfDecrypt(inPath: string, out: string, password: string): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfWatermark(
    inPath: string,
    out: string,
    opts: { text: string; fontSize: number; opacity: number; color: string; rotate: number; repeat: boolean },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfFromHtml(
    html: string,
    out: string,
    opts: {
      pageSize: string;
      landscape: boolean;
      margins: { top: number; bottom: number; left: number; right: number };
      headerTemplate: string;
      footerTemplate: string;
    },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfToWord(inPath: string, out: string): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfRebuild(inputs: string[], out: string, pages: unknown[]): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfEditText(inPath: string, out: string, edits: unknown[]): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfRedact(inPath: string, out: string, redactions: unknown[]): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfOcr(
    inPath: string,
    out: string,
    opts: { language?: string; scale?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfCompress(inPath: string, out: string, opts: { quality?: number }): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfPageNumbers(
    inPath: string,
    out: string,
    opts: { start?: number; position?: string; fontSize?: number; color?: string; format?: string; margin?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfHeaderFooter(
    inPath: string,
    out: string,
    opts: { header?: string; footer?: string; fontSize?: number; color?: string; margin?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfOrganize(
    inPath: string,
    out: string,
    opts: { order: number[]; rotate?: Record<string, number> },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfPageSize(
    inPath: string,
    out: string,
    opts: { preset?: string; widthPt?: number; heightPt?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfBackground(
    inPath: string,
    out: string,
    opts: { color?: string; opacity?: number; imagePath?: string },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfListFormFields(p: string): Promise<{ ok: boolean; message: string; fields?: { name: string; type: string; value?: string; options?: string[]; readOnly: boolean }[] }>;
  pdfFillForm(
    inPath: string,
    out: string,
    opts: { values: Record<string, string>; flatten?: boolean },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfSign(
    inPath: string,
    out: string,
    opts: { page?: number; position?: string; text?: string; imagePath?: string; fontSize?: number; color?: string; maxWidth?: number; margin?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfExportImages(
    inPath: string,
    outDir: string,
    opts: { format?: 'png' | 'jpeg'; scale?: number },
  ): Promise<{ ok: boolean; message: string; outputs?: string[] }>;
  imagesToPdf(imagePaths: string[], out: string): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfGetMetadata(p: string): Promise<{ ok: boolean; message: string; metadata?: { title?: string; author?: string; subject?: string; keywords?: string[] } }>;
  pdfSetMetadata(
    inPath: string,
    out: string,
    meta: { title?: string; author?: string; subject?: string; keywords?: string[] },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfBatesNumbering(
    inPath: string,
    out: string,
    opts: { prefix?: string; start?: number; digits?: number; position?: string; fontSize?: number; color?: string; margin?: number },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfPermissions(
    inPath: string,
    out: string,
    opts: { userPassword?: string; ownerPassword?: string; printing?: string; modifying?: boolean; copying?: boolean; annotating?: boolean; documentAssembly?: boolean },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfAddFormField(
    inPath: string,
    out: string,
    opts: { page?: number; type?: string; name?: string; x?: number; y?: number; width?: number; height?: number; defaultValue?: string; options?: string[] },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfAttachFile(
    inPath: string,
    out: string,
    opts: { filePath?: string; description?: string },
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfSetBookmarks(
    inPath: string,
    out: string,
    bookmarks: { title: string; page: number }[],
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfReadFileBase64(p: string): Promise<{ ok: boolean; base64?: string; message?: string }>;
  htmlToPdfBase64(html: string, opts: unknown): Promise<{ ok: boolean; base64?: string; message?: string }>;
  storeLoadSession(): Promise<SessionData | null>;
  storeSaveSession(session: SessionData): Promise<{ ok: boolean }>;
  storeClearSession(): Promise<{ ok: boolean }>;
  recentsList(): Promise<string[]>;
  recentsAdd(p: string): Promise<string[]>;
  recentsRemove(p: string): Promise<string[]>;
  recentsClear(): Promise<string[]>;
}

const api: Api = {
  openFiles: (filters) => ipcRenderer.invoke('dialog:openFiles', filters),
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  saveFile: (opts) => ipcRenderer.invoke('dialog:saveFile', opts),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readText: (p) => ipcRenderer.invoke('fs:readText', p),
  readBase64: (p) => ipcRenderer.invoke('fs:readBase64', p),
  writeText: (p, data) => ipcRenderer.invoke('fs:writeText', p, data),
  writeBase64: (p, data) => ipcRenderer.invoke('fs:writeBase64', p, data),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  pdfPageCount: (p) => ipcRenderer.invoke('pdf:pageCount', p),
  pdfExtractText: (p) => ipcRenderer.invoke('pdf:extractText', p),
  pdfSmartImportText: (p) => ipcRenderer.invoke('pdf:smartImportText', p),
  pdfImportAsVisualHtml: (p) => ipcRenderer.invoke('pdf:importAsVisualHtml', p),
  pdfMerge: (paths, out) => ipcRenderer.invoke('pdf:merge', paths, out),
  pdfSplit: (inPath, ranges, outDir) => ipcRenderer.invoke('pdf:split', inPath, ranges, outDir),
  pdfEncrypt: (inPath, out, password) => ipcRenderer.invoke('pdf:encrypt', inPath, out, password),
  pdfDecrypt: (inPath, out, password) => ipcRenderer.invoke('pdf:decrypt', inPath, out, password),
  pdfWatermark: (inPath, out, opts) => ipcRenderer.invoke('pdf:watermark', inPath, out, opts),
  pdfFromHtml: (html, out, opts) => ipcRenderer.invoke('pdf:fromHtml', html, out, opts),
  pdfToWord: (inPath, out) => ipcRenderer.invoke('pdf:toWord', inPath, out),
  pdfRebuild: (inputs, out, pages) => ipcRenderer.invoke('pdf:rebuild', inputs, out, pages),
  pdfEditText: (inPath, out, edits) => ipcRenderer.invoke('pdf:editText', inPath, out, edits),
  pdfRedact: (inPath, out, redactions) => ipcRenderer.invoke('pdf:redact', inPath, out, redactions),
  pdfOcr: (inPath, out, opts) => ipcRenderer.invoke('pdf:ocr', inPath, out, opts),
  pdfCompress: (inPath, out, opts) => ipcRenderer.invoke('pdf:compress', inPath, out, opts),
  pdfPageNumbers: (inPath, out, opts) => ipcRenderer.invoke('pdf:pageNumbers', inPath, out, opts),
  pdfHeaderFooter: (inPath, out, opts) => ipcRenderer.invoke('pdf:headerFooter', inPath, out, opts),
  pdfOrganize: (inPath, out, opts) => ipcRenderer.invoke('pdf:organize', inPath, out, opts),
  pdfPageSize: (inPath, out, opts) => ipcRenderer.invoke('pdf:pageSize', inPath, out, opts),
  pdfBackground: (inPath, out, opts) => ipcRenderer.invoke('pdf:background', inPath, out, opts),
  pdfListFormFields: (p) => ipcRenderer.invoke('pdf:listFormFields', p),
  pdfFillForm: (inPath, out, opts) => ipcRenderer.invoke('pdf:fillForm', inPath, out, opts),
  pdfSign: (inPath, out, opts) => ipcRenderer.invoke('pdf:sign', inPath, out, opts),
  pdfExportImages: (inPath, outDir, opts) => ipcRenderer.invoke('pdf:exportImages', inPath, outDir, opts),
  imagesToPdf: (imagePaths, out) => ipcRenderer.invoke('pdf:imagesToPdf', imagePaths, out),
  pdfGetMetadata: (p) => ipcRenderer.invoke('pdf:getMetadata', p),
  pdfSetMetadata: (inPath, out, meta) => ipcRenderer.invoke('pdf:setMetadata', inPath, out, meta),
  pdfBatesNumbering: (inPath, out, opts) => ipcRenderer.invoke('pdf:batesNumbering', inPath, out, opts),
  pdfPermissions: (inPath, out, opts) => ipcRenderer.invoke('pdf:permissions', inPath, out, opts),
  pdfAddFormField: (inPath, out, opts) => ipcRenderer.invoke('pdf:addFormField', inPath, out, opts),
  pdfAttachFile: (inPath, out, opts) => ipcRenderer.invoke('pdf:attachFile', inPath, out, opts),
  pdfSetBookmarks: (inPath, out, bookmarks) => ipcRenderer.invoke('pdf:setBookmarks', inPath, out, bookmarks),
  pdfReadFileBase64: (p) => ipcRenderer.invoke('pdf:readFileBase64', p),
  htmlToPdfBase64: (html, opts) => ipcRenderer.invoke('pdf:htmlToPdfBase64', html, opts),
  storeLoadSession: () => ipcRenderer.invoke('store:loadSession'),
  storeSaveSession: (session) => ipcRenderer.invoke('store:saveSession', session),
  storeClearSession: () => ipcRenderer.invoke('store:clearSession'),
  recentsList: () => ipcRenderer.invoke('recents:list'),
  recentsAdd: (p) => ipcRenderer.invoke('recents:add', p),
  recentsRemove: (p) => ipcRenderer.invoke('recents:remove', p),
  recentsClear: () => ipcRenderer.invoke('recents:clear'),
};

contextBridge.exposeInMainWorld('api', api);
