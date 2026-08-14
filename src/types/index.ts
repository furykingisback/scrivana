import type { JSONContent } from '@tiptap/core';

export type PageSize = 'A4' | 'Letter' | 'A5';
export type Orientation = 'portrait' | 'landscape';
export type Align = 'left' | 'center' | 'right' | 'justify';
export type ThemeMode = 'dark' | 'light';

export interface PageSettings {
  size: PageSize;
  orientation: Orientation;
  margins: { top: number; bottom: number; left: number; right: number };
}

export interface HeaderFooterSettings {
  enabled: boolean;
  text: string;
  pageNumber: boolean;
  align: Align;
}

export interface DocMeta {
  title: string;
  author: string;
}

export interface DocumentState {
  id: string;
  name: string;
  path?: string;
  dirty: boolean;
  content: JSONContent | string;
  page: PageSettings;
  header: HeaderFooterSettings;
  footer: HeaderFooterSettings;
  meta: DocMeta;
}

export interface PdfResult {
  ok: boolean;
  message: string;
  output?: string;
  outputs?: string[];
}

export interface PrintOptions {
  pageSize: string;
  landscape: boolean;
  margins: { top: number; bottom: number; left: number; right: number };
  headerTemplate: string;
  footerTemplate: string;
}
