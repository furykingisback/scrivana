import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import type { DocumentState } from '@/types';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { Icon } from '@/lib/icons';
import { randomId, defaultPageSettings, sanitizeFileName } from '@/lib/utils';
import { importDocxAsHtml, importMarkdownAsHtml, importTextAsHtml, pdfPagesToHtml } from '@/lib/importers';
import { buildExportBundle } from '@/lib/htmlExport';
import { htmlToDocxBase64, htmlToDocxBase64Filled } from '@/lib/docx';
import { detectTemplateFields } from '@/lib/docxTemplate';
import { EditorPage } from './EditorPage';
import { TabsBar } from './TabsBar';
import { Ribbon } from './Ribbon';
import { FileMenu, FileMenuItem } from './FileMenu';
import { StatusBar } from './StatusBar';
import { PdfToolsPanel } from './PdfToolsPanel';
import { PdfEditorPanel } from './PdfEditorPanel';
import { PdfThumbsPanel } from './PdfThumbsPanel';
import { ConfirmCloseModal } from './ConfirmModal';
import { CommandPalette, PaletteAction } from './CommandPalette';
import { TemplateModal } from './TemplateModal';
import { getPageSizeMm, PX_PER_MM } from '@/lib/utils';

const FILTER_ALL = [
  { name: 'Tüm Desteklenenler', extensions: ['akdoc', 'json', 'docx', 'md', 'markdown', 'txt', 'html', 'pdf'] },
  { name: 'Scrivana Belgesi', extensions: ['akdoc', 'json'] },
  { name: 'Word Belgesi', extensions: ['docx'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'Metin', extensions: ['txt'] },
  { name: 'HTML', extensions: ['html', 'htm'] },
  { name: 'PDF', extensions: ['pdf'] },
];
const FILTER_PDF = [{ name: 'PDF Dosyası', extensions: ['pdf'] }];
const FILTER_IMG = [{ name: 'Görüntü Dosyası', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] }];

function createDoc(name: string, overrides: Partial<DocumentState> = {}): DocumentState {
  return {
    id: randomId(),
    name,
    path: undefined,
    dirty: false,
    content: '<p></p>',
    page: defaultPageSettings(),
    header: { enabled: false, text: '', pageNumber: true, align: 'center' },
    footer: { enabled: false, text: '', pageNumber: true, align: 'center' },
    meta: { title: name, author: '' },
    ...overrides,
  };
}

function extOf(p: string): string {
  const parts = p.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
};

export function StudioApp(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [docs, setDocs] = useState<DocumentState[]>(() => [createDoc('Belgesiz')]);
  const [activeId, setActiveId] = useState<string>('__init__');
  const [zoom, setZoom] = useState(100);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState<{ id: string; name: string } | null>(null);
  const [templateFields, setTemplateFields] = useState<string[] | null>(null);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [pdfEditorOpen, setPdfEditorOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const editorRef = useRef<Editor | null>(null);

  const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0];

  useEffect(() => {
    if (activeId === '__init__' && docs[0]) setActiveId(docs[0].id);
  }, [activeId, docs]);

  // ---- Session restore on boot ----
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await window.api.storeLoadSession();
        if (cancelled || !session || !Array.isArray(session.docs) || session.docs.length === 0) return;
        const restored = (session.docs as DocumentState[]).map((d) => ({ ...d, dirty: false }));
        setDocs(restored);
        setActiveId(restored.some((d) => d.id === session.activeId) ? session.activeId : restored[0].id);
      } catch {
        /* session yok veya bozuk: varsayılan boş belge */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Debounced session autosave ----
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      void window.api
        .storeSaveSession({ docs, activeId: docs[0] ? activeDoc.id : '' })
        .catch(() => undefined);
    }, 900);
    return () => clearTimeout(timer);
  }, [docs, activeId, hydrated, activeDoc.id]);

  const refreshRecents = useCallback(async () => {
    try {
      setRecents(await window.api.recentsList());
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (fileMenuOpen) void refreshRecents();
  }, [fileMenuOpen, refreshRecents]);

  const updateDoc = useCallback((id: string, patch: Partial<DocumentState>) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const patchActive = useCallback(
    (patch: Partial<DocumentState>) => {
      setDocs((prev) => prev.map((d) => (d.id === activeId ? { ...d, ...patch } : d)));
    },
    [activeId],
  );

  const onContentChange = useCallback(
    (json: JSONContent) => {
      setDocs((prev) => prev.map((d) => (d.id === activeId ? { ...d, content: json, dirty: true } : d)));
    },
    [activeId],
  );

  const newDoc = useCallback(() => {
    const doc = createDoc(`Belge ${docs.length + 1}`);
    setDocs((prev) => [...prev, doc]);
    setActiveId(doc.id);
  }, [docs.length]);

  const removeDoc = useCallback(
    (id: string) => {
      const remaining = docs.filter((d) => d.id !== id);
      if (remaining.length === 0) {
        const blank = createDoc('Belgesiz');
        setDocs([blank]);
        setActiveId(blank.id);
      } else {
        setDocs(remaining);
        if (activeId === id) setActiveId(remaining[remaining.length - 1].id);
      }
    },
    [docs, activeId],
  );

  const closeTab = useCallback(
    (id: string) => {
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;
      if (doc.dirty) {
        setPendingClose({ id, name: doc.name });
        return;
      }
      removeDoc(id);
    },
    [docs, removeDoc],
  );

  const renameTab = useCallback(
    (id: string, name: string) => updateDoc(id, { name }),
    [updateDoc],
  );

  const addTabFromHtml = useCallback(
    (name: string, html: string, markDirty = true) => {
      const doc = createDoc(name, { content: html, dirty: markDirty });
      setDocs((prev) => [...prev, doc]);
      setActiveId(doc.id);
    },
    [],
  );

  const saveDoc = useCallback(
    async (id: string, forceAs: boolean) => {
      const doc = docs.find((d) => d.id === id);
      if (!doc) return false;
      const editor = editorRef.current;
      const content = editor ? editor.getJSON() : doc.content;
      const payload = {
        format: 'scrivana-doc',
        version: 1,
        name: doc.name,
        page: doc.page,
        header: doc.header,
        footer: doc.footer,
        meta: doc.meta,
        content,
      };
      let outPath: string | null | undefined = doc.path;
      if (forceAs || !outPath) {
        outPath = await window.api.saveFile({
          defaultName: `${sanitizeFileName(doc.name)}.akdoc`,
          filters: [{ name: 'Scrivana Belgesi', extensions: ['akdoc'] }],
        });
        if (!outPath) return false;
      }
      try {
        await window.api.writeText(outPath, JSON.stringify(payload, null, 2));
        updateDoc(id, { path: outPath, dirty: false });
        void window.api.recentsAdd(outPath);
        return true;
      } catch (err) {
        toast(`Kaydetme hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
        return false;
      }
    },
    [docs, updateDoc, toast],
  );

  const exportPdf = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(activeDoc.name)}.pdf`,
      filters: FILTER_PDF,
    });
    if (!out) return;
    const { html, opts } = buildExportBundle(editor.getHTML(), activeDoc);
    const res = await window.api.pdfFromHtml(html, out, opts);
    if (res.ok && res.output) {
      toast('PDF başarıyla oluşturuldu.', 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
    } else {
      toast(res.message || 'PDF oluşturulamadı.', 'error');
    }
  }, [activeDoc, toast]);

  const exportWord = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(activeDoc.name)}.docx`,
      filters: [{ name: 'Word Belgesi', extensions: ['docx'] }],
    });
    if (!out) return;
    try {
      const b64 = await htmlToDocxBase64(editor.getHTML(), activeDoc);
      await window.api.writeBase64(out, b64);
      toast('Word belgesi oluşturuldu.', 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(out) });
    } catch (err) {
      toast(`Word dışa aktarma hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  }, [activeDoc, toast]);

  const pendingTemplateHtml = useRef<string>('');

  const exportWordTemplate = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.getHTML();
    const fields = detectTemplateFields(html);
    if (fields.length === 0) {
      toast('Belgede şablon alanı ({{alan}}) bulunamadı.', 'info');
      return;
    }
    pendingTemplateHtml.current = html;
    setTemplateFields(fields);
  }, [toast]);

  const runTemplateExport = useCallback(
    async (values: Record<string, string>) => {
      const html = pendingTemplateHtml.current;
      pendingTemplateHtml.current = '';
      setTemplateFields(null);
      if (!html) return;
      const out = await window.api.saveFile({
        defaultName: `${sanitizeFileName(activeDoc.name)}-sablon.docx`,
        filters: [{ name: 'Word Belgesi', extensions: ['docx'] }],
      });
      if (!out) return;
      try {
        const b64 = await htmlToDocxBase64Filled(html, activeDoc, values);
        await window.api.writeBase64(out, b64);
        toast('Şablon Word belgesi oluşturuldu.', 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(out) });
      } catch (err) {
        toast(`Şablon dışa aktarma hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    },
    [activeDoc, toast],
  );

  const importFromPath = useCallback(
    async (file: string) => {
      const ext = extOf(file);
      try {
        if (ext === 'pdf') {
          const res = await window.api.pdfImportAsVisualHtml(file);
          if (!res.ok || !res.html) {
            toast(res.message, 'error');
            return;
          }
          addTabFromHtml(`${file.split(/[\\/]/).pop()?.replace(/\.pdf$/i, '') ?? 'PDF'}`, res.html);
          void window.api.recentsAdd(file);
          toast('PDF sayfaları görsel yerleşimiyle tam olarak içe aktarıldı.', 'success');
          return;
        }
        if (ext === 'docx') {
          const b64 = await window.api.readBase64(file);
          const html = await importDocxAsHtml(b64);
          addTabFromHtml(`${file.split(/[\\/]/).pop()?.replace(/\.docx$/i, '') ?? 'Word'}`, html);
          void window.api.recentsAdd(file);
          toast('Word belgesi içe aktarıldı.', 'success');
          return;
        }
        if (ext === 'md' || ext === 'markdown') {
          const text = await window.api.readText(file);
          addTabFromHtml(`${file.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? 'Markdown'}`, importMarkdownAsHtml(text));
          void window.api.recentsAdd(file);
          return;
        }
        if (ext === 'txt') {
          const text = await window.api.readText(file);
          addTabFromHtml(`${file.split(/[\\/]/).pop()?.replace(/\.txt$/i, '') ?? 'Metin'}`, importTextAsHtml(text));
          void window.api.recentsAdd(file);
          return;
        }
        if (ext === 'html' || ext === 'htm') {
          const text = await window.api.readText(file);
          addTabFromHtml(`${file.split(/[\\/]/).pop()?.replace(/\.html?$/i, '') ?? 'HTML'}`, text);
          void window.api.recentsAdd(file);
          return;
        }
        if (ext === 'akdoc' || ext === 'json') {
          const text = await window.api.readText(file);
          const data = JSON.parse(text) as Record<string, unknown>;
          if (data.format !== 'scrivana-doc') throw new Error('Geçersiz Scrivana Belgesi formatı.');
          const name = typeof data.name === 'string' ? data.name : 'Belge';
          const doc = createDoc(name, {
            path: file,
            content: (data.content as DocumentState['content']) ?? '<p></p>',
            page: (data.page as DocumentState['page']) ?? defaultPageSettings(),
            header: (data.header as DocumentState['header']) ?? { enabled: false, text: '', pageNumber: true, align: 'center' },
            footer: (data.footer as DocumentState['footer']) ?? { enabled: false, text: '', pageNumber: true, align: 'center' },
            meta: (data.meta as DocumentState['meta']) ?? { title: name, author: '' },
          });
          setDocs((prev) => [...prev, doc]);
          setActiveId(doc.id);
          void window.api.recentsAdd(file);
          toast('Belge açıldı.', 'success');
          return;
        }
        toast('Desteklenmeyen dosya türü.', 'error');
      } catch (err) {
        toast(`İçe aktarma hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
      }
    },
    [addTabFromHtml, toast],
  );

  const openOrImport = useCallback(async () => {
    const files = await window.api.openFiles(FILTER_ALL);
    if (!files) return;
    for (const f of files) await importFromPath(f);
  }, [importFromPath]);

  const insertImage = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    const file = await window.api.openFile(FILTER_IMG);
    if (!file) return;
    const b64 = await window.api.readBase64(file);
    const ext = extOf(file);
    const mime = IMAGE_MIME[ext] ?? 'image/png';
    editor.chain().focus().setImage({ src: `data:${mime};base64,${b64}` }).run();
    patchActive({ dirty: true });
  }, [patchActive]);

  // ---- Keyboard shortcuts ----
  const actionsRef = useRef({
    newDoc,
    openOrImport,
    save: () => void saveDoc(activeId, false),
    saveAs: () => void saveDoc(activeId, true),
    exportPdf,
    exportWord,
    exportWordTemplate,
    closeCurrent: () => closeTab(activeId),
    togglePanel: () => setPdfPanelOpen((v) => !v),
    togglePalette: () => setPaletteOpen((v) => !v),
    toggleThumbs: () => setThumbsOpen((v) => !v),
    toggleEditor: () => setPdfEditorOpen((v) => !v),
  });
  useEffect(() => {
    actionsRef.current = {
      newDoc,
      openOrImport,
      save: () => void saveDoc(activeId, false),
      saveAs: () => void saveDoc(activeId, true),
      exportPdf,
      exportWord,
      exportWordTemplate,
      closeCurrent: () => closeTab(activeId),
      togglePanel: () => setPdfPanelOpen((v) => !v),
      togglePalette: () => setPaletteOpen((v) => !v),
      toggleThumbs: () => setThumbsOpen((v) => !v),
      toggleEditor: () => setPdfEditorOpen((v) => !v),
    };
  }, [newDoc, openOrImport, saveDoc, exportPdf, exportWord, exportWordTemplate, closeTab, activeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'k' && e.shiftKey) {
        e.preventDefault();
        actionsRef.current.toggleThumbs();
      } else if (k === 'k') {
        e.preventDefault();
        actionsRef.current.togglePalette();
      } else if (k === 'n') {
        e.preventDefault();
        actionsRef.current.newDoc();
      } else if (k === 'o') {
        e.preventDefault();
        void actionsRef.current.openOrImport();
      } else if (k === 's') {
        e.preventDefault();
        if (e.shiftKey) actionsRef.current.saveAs();
        else actionsRef.current.save();
      } else if (k === 'p') {
        e.preventDefault();
        if (e.shiftKey) actionsRef.current.toggleEditor();
        else void actionsRef.current.exportPdf();
      } else if (k === 'w') {
        e.preventDefault();
        actionsRef.current.closeCurrent();
      } else if (k === 'e') {
        e.preventDefault();
        actionsRef.current.togglePanel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- File menu items ----
  const menuItems: FileMenuItem[] = [
    {
      label: 'Yeni Belge',
      icon: 'new',
      shortcut: 'Ctrl+N',
      onClick: () => {
        setFileMenuOpen(false);
        actionsRef.current.newDoc();
      },
    },
    {
      label: 'Aç / İçe Aktar',
      icon: 'open',
      shortcut: 'Ctrl+O',
      onClick: () => {
        setFileMenuOpen(false);
        void actionsRef.current.openOrImport();
      },
    },
    {
      label: 'Kaydet',
      icon: 'save',
      shortcut: 'Ctrl+S',
      onClick: () => {
        setFileMenuOpen(false);
        actionsRef.current.save();
      },
    },
    {
      label: 'Farklı Kaydet',
      icon: 'save-as',
      shortcut: 'Ctrl+Shift+S',
      onClick: () => {
        setFileMenuOpen(false);
        actionsRef.current.saveAs();
      },
    },
    { separator: true, label: '', icon: 'page', onClick: () => undefined },
    {
      label: 'PDF Olarak Dışa Aktar',
      icon: 'export-pdf',
      shortcut: 'Ctrl+P',
      onClick: () => {
        setFileMenuOpen(false);
        void actionsRef.current.exportPdf();
      },
    },
    {
      label: 'Word (.docx) Olarak Dışa Aktar',
      icon: 'export-word',
      onClick: () => {
        setFileMenuOpen(false);
        void actionsRef.current.exportWord();
      },
    },
    {
      label: 'Word Şablonuyla Dışa Aktar',
      icon: 'template',
      onClick: () => {
        setFileMenuOpen(false);
        actionsRef.current.exportWordTemplate();
      },
    },
    { separator: true, label: '', icon: 'page', onClick: () => undefined },
    {
      label: 'PDF Araçları',
      icon: 'tools',
      shortcut: 'Ctrl+E',
      onClick: () => {
        setFileMenuOpen(false);
        setPdfPanelOpen((v) => !v);
      },
    },
    {
      label: theme === 'dark' ? 'Açık Tema' : 'Koyu Tema',
      icon: theme === 'dark' ? 'sun' : 'moon',
      onClick: () => {
        setFileMenuOpen(false);
        toggleTheme();
      },
    },
  ];

  const openRecent = useCallback(
    (p: string) => {
      setFileMenuOpen(false);
      void importFromPath(p);
    },
    [importFromPath],
  );

  const removeRecentItem = useCallback(async (p: string) => {
    setRecents(await window.api.recentsRemove(p));
  }, []);

  const clearRecentList = useCallback(async () => {
    setRecents(await window.api.recentsClear());
  }, []);

  const jumpToPage = useCallback(
    (pageIndex: number) => {
      const scrollEl = document.getElementById('ak-editor-scroll');
      if (!scrollEl) return;
      const page = getPageSizeMm(activeDoc.page.size, activeDoc.page.orientation);
      const pageH = page.height * PX_PER_MM * (zoom / 100);
      scrollEl.scrollTo({ top: pageIndex * pageH, behavior: 'smooth' });
    },
    [activeDoc.page.size, activeDoc.page.orientation, zoom],
  );

  // ---- Command palette actions ----
  const paletteActions = useMemo<PaletteAction[]>(() => {
    const base: PaletteAction[] = [
      { id: 'new', label: 'Yeni Belge', icon: 'new', hint: 'Ctrl+N', run: () => actionsRef.current.newDoc() },
      { id: 'open', label: 'Aç / İçe Aktar', icon: 'open', hint: 'Ctrl+O', run: () => void actionsRef.current.openOrImport() },
      { id: 'save', label: 'Kaydet', icon: 'save', hint: 'Ctrl+S', run: () => actionsRef.current.save() },
      { id: 'save-as', label: 'Farklı Kaydet', icon: 'save-as', hint: 'Ctrl+Shift+S', run: () => actionsRef.current.saveAs() },
      { id: 'export-pdf', label: 'PDF Olarak Dışa Aktar', icon: 'export-pdf', hint: 'Ctrl+P', run: () => void actionsRef.current.exportPdf() },
      { id: 'export-word', label: 'Word (.docx) Olarak Dışa Aktar', icon: 'export-word', run: () => void actionsRef.current.exportWord() },
      { id: 'export-template', label: 'Word Şablonuyla Dışa Aktar', icon: 'template', run: () => actionsRef.current.exportWordTemplate() },
      { id: 'panel', label: 'PDF Araçları', icon: 'tools', hint: 'Ctrl+E', run: () => actionsRef.current.togglePanel() },
      { id: 'thumbs', label: 'Sayfa Küçük Resimleri', icon: 'page', hint: 'Ctrl+Shift+K', run: () => actionsRef.current.toggleThumbs() },
      { id: 'editor', label: 'PDF Düzenle (Sayfa Düzenleyici)', icon: 'rotate', hint: 'Ctrl+Shift+P', run: () => actionsRef.current.toggleEditor() },
      { id: 'theme', label: theme === 'dark' ? 'Açık Tema' : 'Koyu Tema', icon: theme === 'dark' ? 'sun' : 'moon', run: () => toggleTheme() },
    ];
    for (const p of recents) {
      base.push({
        id: `recent:${p}`,
        label: `Son açılan: ${p.split(/[\\/]/).pop() ?? p}`,
        icon: 'clock',
        hint: 'Son açılanlar',
        run: () => openRecent(p),
      });
    }
    for (const d of docs) {
      base.push({
        id: `doc:${d.id}`,
        label: `Belgeye git: ${d.name}`,
        icon: 'page',
        hint: d.dirty ? 'kaydedilmedi' : 'kaydedildi',
        run: () => setActiveId(d.id),
      });
    }
    return base;
  }, [theme, toggleTheme, recents, docs, openRecent]);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)] text-[var(--text)]">
      {/* App bar */}
      <div className="relative flex h-11 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--ribbon-bg)] px-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
            <Icon name="sparkles" className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-tight">
            Scrivana <span className="text-[var(--accent-text)]">PDF &amp; Word Studio</span>
          </span>
        </div>
        <div className="relative">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${fileMenuOpen ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]' : 'text-[var(--text)] hover:bg-[var(--hover)]'}`}
            onClick={() => setFileMenuOpen((v) => !v)}
          >
            Dosya
            <Icon name="chevron-down" className="h-3.5 w-3.5" />
          </button>
          <FileMenu
            items={menuItems}
            open={fileMenuOpen}
            recents={recents}
            onRecentOpen={openRecent}
            onRecentRemove={(p) => void removeRecentItem(p)}
            onClearRecents={() => void clearRecentList()}
          />
        </div>
        <div className="mx-2 h-5 w-px bg-[var(--border)]" />
        <span className="hidden text-xs text-[var(--muted)] md:block">Yerel belge stüdyosu — internet gerektirmez</span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          onClick={() => setPdfPanelOpen((v) => !v)}
          title="PDF Araçları (Ctrl+E)"
        >
          <Icon name="tools" className="h-4 w-4" />
          <span className="hidden sm:block">PDF Araçları</span>
        </button>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          onClick={() => setThumbsOpen((v) => !v)}
          title="Sayfa Küçük Resimleri (Ctrl+Shift+K)"
        >
          <Icon name="page" className="h-4 w-4" />
          <span className="hidden sm:block">Sayfalar</span>
        </button>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          onClick={() => setPdfEditorOpen((v) => !v)}
          title="PDF Düzenle (Ctrl+Shift+P)"
        >
          <Icon name="rotate" className="h-4 w-4" />
          <span className="hidden sm:block">PDF Düzenle</span>
        </button>
        <button
          className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          onClick={toggleTheme}
          title="Tema değiştir"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>

      <TabsBar
        docs={docs}
        activeId={activeDoc.id}
        onSelect={setActiveId}
        onClose={closeTab}
        onNew={newDoc}
        onRename={renameTab}
      />

      <Ribbon
        editor={editorRef.current}
        doc={activeDoc}
        theme={theme}
        onToggleTheme={toggleTheme}
        pdfPanelOpen={pdfPanelOpen}
        onTogglePdfPanel={() => setPdfPanelOpen((v) => !v)}
        onNew={newDoc}
        onOpen={() => void openOrImport()}
        onSave={() => void saveDoc(activeDoc.id, false)}
        onSaveAs={() => void saveDoc(activeDoc.id, true)}
        onExportPdf={() => void exportPdf()}
        onExportWord={() => void exportWord()}
        zoom={zoom}
        onZoom={setZoom}
        onInsertImage={() => void insertImage()}
        onUpdateDoc={(patch) => patchActive({ ...patch, dirty: true })}
      />

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1">
          <EditorPage
            key={activeDoc.id}
            doc={activeDoc}
            zoom={zoom}
            onContentChange={onContentChange}
            onEditorReady={(e) => {
              editorRef.current = e;
            }}
          />
        </main>
        {pdfPanelOpen && <PdfToolsPanel onClose={() => setPdfPanelOpen(false)} onImport={() => void openOrImport()} />}
        {pdfEditorOpen && <PdfEditorPanel onClose={() => setPdfEditorOpen(false)} onOpenInEditor={(file) => void importFromPath(file)} />}
        {thumbsOpen && (
          <PdfThumbsPanel
            doc={activeDoc}
            getHtml={() => editorRef.current?.getHTML() ?? ''}
            onClose={() => setThumbsOpen(false)}
            onJump={jumpToPage}
          />
        )}
      </div>

      <StatusBar editor={editorRef.current} doc={activeDoc} zoom={zoom} />

      {pendingClose && (
        <ConfirmCloseModal
          name={pendingClose.name}
          onSave={async () => {
            const saved = await saveDoc(pendingClose.id, false);
            if (saved) {
              closeTab(pendingClose.id);
              setPendingClose(null);
            }
          }}
          onDiscard={() => {
            const id = pendingClose.id;
            setPendingClose(null);
            removeDoc(id);
          }}
          onCancel={() => setPendingClose(null)}
        />
      )}

      <CommandPalette open={paletteOpen} actions={paletteActions} onClose={() => setPaletteOpen(false)} />
      {templateFields && (
        <TemplateModal
          fields={templateFields}
          onSubmit={(values) => void runTemplateExport(values)}
          onCancel={() => setTemplateFields(null)}
        />
      )}
    </div>
  );
}
