declare module 'pdfjs-dist/legacy/build/pdf.js' {
  export interface TextItem {
    str: string;
    hasEOL?: boolean;
  }
  export interface TextContent {
    items: TextItem[];
  }
  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: { canvasContext: unknown; viewport: unknown }): { promise: Promise<void> };
  }
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  export interface GetDocumentParams {
    data: Uint8Array;
    isEvalSupported?: boolean;
    useSystemFonts?: boolean;
    disableWorker?: boolean;
    disableFontFace?: boolean;
    canvasFactory?: {
      create(width: number, height: number): { canvas: unknown; context: unknown };
      reset(entry: { canvas: unknown; context: unknown }, width: number, height: number): void;
      destroy(entry: { canvas: unknown; context: unknown }): void;
    };
  }
  export function getDocument(params: GetDocumentParams): PDFDocumentLoadingTask;
  export const GlobalWorkerOptions: {
    workerSrc: string;
    workerPort: unknown;
  };
}
