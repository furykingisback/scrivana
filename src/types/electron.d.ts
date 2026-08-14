export interface AkSessionData {
  docs: unknown[];
  activeId: string;
}

export interface PdfAnnotationSpec {
  type: 'text' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  color?: string;
}

export interface PdfPageSpec {
  file: number;
  page: number;
  rotation?: number;
  annotations?: PdfAnnotationSpec[];
}

export interface AkApi {
  openFiles(filters: { name: string; extensions: string[] }[]): Promise<string[] | null>;
  openFile(filters: { name: string; extensions: string[] }[]): Promise<string | null>;
  saveFile(opts: { title?: string; defaultName: string; filters: { name: string; extensions: string[] }[] }): Promise<string | null>;
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
  pdfRebuild(inputs: string[], out: string, pages: PdfPageSpec[]): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfEditText(
    inPath: string,
    out: string,
    edits: { page: number; x: number; baseline: number; width: number; height: number; text: string; fontSize?: number; color?: string }[],
  ): Promise<{ ok: boolean; message: string; output?: string }>;
  pdfRedact(
    inPath: string,
    out: string,
    redactions: { page: number; x: number; y: number; width: number; height: number }[],
  ): Promise<{ ok: boolean; message: string; output?: string }>;
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
  htmlToPdfBase64(html: string, opts: { pageSize: string; landscape: boolean; margins: { top: number; bottom: number; left: number; right: number }; headerTemplate: string; footerTemplate: string }): Promise<{ ok: boolean; base64?: string; message?: string }>;
  storeLoadSession(): Promise<AkSessionData | null>;
  storeSaveSession(session: AkSessionData): Promise<{ ok: boolean }>;
  storeClearSession(): Promise<{ ok: boolean }>;
  recentsList(): Promise<string[]>;
  recentsAdd(p: string): Promise<string[]>;
  recentsRemove(p: string): Promise<string[]>;
  recentsClear(): Promise<string[]>;
}

declare global {
  interface Window {
    api: AkApi;
  }
}

export {};
