import { useEffect, useRef, useState, ReactNode } from 'react';
import type { Editor } from '@tiptap/core';
import type { DocumentState, ThemeMode } from '@/types';
import { Icon, IconName } from '@/lib/icons';
import { FONT_FAMILIES, FONT_SIZES, LINE_SPACINGS, MARGIN_PRESETS, PAGE_SIZE_LABELS } from '@/lib/utils';
import { Modal } from './Modal';

interface RibbonProps {
  editor: Editor | null;
  doc: DocumentState;
  theme: ThemeMode;
  onToggleTheme: () => void;
  pdfPanelOpen: boolean;
  onTogglePdfPanel: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  zoom: number;
  onZoom: (z: number) => void;
  onInsertImage: () => void;
  onUpdateDoc: (patch: Partial<DocumentState>) => void;
}

function ToolButton({
  icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: IconName;
  label?: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}): JSX.Element {
  return (
    <button className={`ak-tbtn ${active ? 'active' : ''}`} onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      <Icon name={icon} />
      {label && <span className="ak-tbtn-label">{label}</span>}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex items-stretch gap-1.5 px-2.5 py-1.5">
      {children}
      <div className="ml-1.5 hidden flex-col justify-center gap-0.5 border-l border-[var(--border)] pl-2.5 lg:flex">
        <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      </div>
    </div>
  );
}

function Popover({
  open,
  onClose,
  children,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  anchor: HTMLElement | null;
}): JSX.Element {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !anchor) return;
    const update = () => {
      const r = anchor.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 6 });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchor]);

  if (!open) return <></>;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="ak-menu fixed z-50 p-2" style={{ left: pos.left, top: pos.top }}>
        {children}
      </div>
    </>
  );
}

export function Ribbon(props: RibbonProps): JSX.Element {
  const {
    editor,
    doc,
    theme,
    onToggleTheme,
    pdfPanelOpen,
    onTogglePdfPanel,
    onNew,
    onOpen,
    onSave,
    onSaveAs,
    onExportPdf,
    onExportWord,
    zoom,
    onZoom,
    onInsertImage,
    onUpdateDoc,
  } = props;

  const [, setTick] = useState(0);
  const [openMenu, setOpenMenu] = useState<null | 'table' | 'link' | 'page'>(null);
  const [tableSize, setTableSize] = useState({ r: 4, c: 4 });
  const [linkUrl, setLinkUrl] = useState('');
  const [showHf, setShowHf] = useState(false);
  const [hfMode, setHfMode] = useState<'header' | 'footer'>('header');

  const tableAnchor = useRef<HTMLDivElement>(null);
  const linkAnchor = useRef<HTMLDivElement>(null);
  const pageAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((t) => t + 1);
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  if (!editor) return <div className="h-[92px] shrink-0" />;

  const attrs = (name: string) => editor.getAttributes(name) as Record<string, unknown>;
  const activeFont = attrs('textStyle').fontFamily as string | undefined;
  const activeSize = (attrs('textStyle').fontSize as string | undefined)?.replace('pt', '') ?? '11';
  const activeLine = attrs('paragraph').lineHeight as string | undefined;
  const currentColor = (attrs('textStyle').color as string | undefined) ?? '#111827';
  const currentHighlight = (attrs('highlight').color as string | undefined) ?? '#fef08a';

  const exec = (fn: (chain: ReturnType<Editor['chain']>) => unknown) => {
    const chain = editor.chain().focus();
    fn(chain);
    (chain as { run: () => void }).run();
  };

  return (
    <div className="relative z-30 flex h-[92px] shrink-0 items-stretch overflow-x-auto border-b border-[var(--border)] bg-[var(--ribbon-bg)]">
      {/* Dosya */}
      <Group label="Dosya">
        <ToolButton icon="new" label="Yeni" onClick={onNew} />
        <ToolButton icon="open" label="Aç" onClick={onOpen} />
        <ToolButton icon="save" label="Kaydet" onClick={onSave} />
        <ToolButton icon="save-as" label="Farklı Kaydet" onClick={onSaveAs} />
      </Group>

      {/* Yazı Tipi */}
      <Group label="Yazı Tipi">
        <select
          className="ak-select w-40"
          value={activeFont ?? 'Arial'}
          title="Yazı Tipi Ailesi"
          onChange={(e) => exec((c) => c.setFontFamily(e.target.value))}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.name} value={f.stack} style={{ fontFamily: f.stack }}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          className="ak-select w-16"
          value={activeSize}
          title="Yazı Boyutu"
          onChange={(e) => exec((c) => c.setFontSize(`${e.target.value}pt`))}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex items-center">
          <ToolButton icon="bold" label="Kalın" active={editor.isActive('bold')} onClick={() => exec((c) => c.toggleBold())} />
          <ToolButton icon="italic" label="İtalik" active={editor.isActive('italic')} onClick={() => exec((c) => c.toggleItalic())} />
          <ToolButton icon="underline" label="Altı Çizili" active={editor.isActive('underline')} onClick={() => exec((c) => c.toggleUnderline())} />
          <ToolButton icon="strike" label="Üstü Çizili" active={editor.isActive('strike')} onClick={() => exec((c) => c.toggleStrike())} />
        </div>
        <div className="flex items-center">
          <div className="relative" title="Metin Rengi">
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--muted)]">
              <Icon name="text-color" className="h-4 w-4" />
            </span>
            <input
              type="color"
              className="h-8 w-8 cursor-pointer rounded-md opacity-0"
              value={currentColor}
              onChange={(e) => exec((c) => c.setColor(e.target.value))}
            />
          </div>
          <div className="relative" title="Vurgu Rengi">
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--muted)]">
              <Icon name="highlight" className="h-4 w-4" />
            </span>
            <input
              type="color"
              className="h-8 w-8 cursor-pointer rounded-md opacity-0"
              value={currentHighlight}
              onChange={(e) => exec((c) => c.toggleHighlight({ color: e.target.value }))}
            />
          </div>
        </div>
      </Group>

      {/* Paragraf */}
      <Group label="Paragraf">
        <ToolButton icon="align-left" label="Sola Hizala" active={editor.isActive({ textAlign: 'left' })} onClick={() => exec((c) => c.setTextAlign('left'))} />
        <ToolButton icon="align-center" label="Ortala" active={editor.isActive({ textAlign: 'center' })} onClick={() => exec((c) => c.setTextAlign('center'))} />
        <ToolButton icon="align-right" label="Sağa Hizala" active={editor.isActive({ textAlign: 'right' })} onClick={() => exec((c) => c.setTextAlign('right'))} />
        <ToolButton icon="align-justify" label="İki Yana Yasla" active={editor.isActive({ textAlign: 'justify' })} onClick={() => exec((c) => c.setTextAlign('justify'))} />
        <div className="flex items-center">
          <select
            className="ak-select w-16"
            title="Satır Aralığı"
            value={activeLine ?? '1.5'}
            onChange={(e) => exec((c) => c.setLineHeight(e.target.value))}
          >
            {LINE_SPACINGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <ToolButton icon="list-bullet" label="Madde İşaretli" active={editor.isActive('bulletList')} onClick={() => exec((c) => c.toggleBulletList())} />
        <ToolButton icon="list-number" label="Numaralı" active={editor.isActive('orderedList')} onClick={() => exec((c) => c.toggleOrderedList())} />
        <ToolButton icon="indent-inc" label="Girintiyi Artır" onClick={() => exec((c) => c.sinkListItem('listItem'))} />
        <ToolButton icon="indent-dec" label="Girintiyi Azalt" onClick={() => exec((c) => c.liftListItem('listItem'))} />
        <ToolButton icon="quote" label="Alıntı" active={editor.isActive('blockquote')} onClick={() => exec((c) => c.toggleBlockquote())} />
      </Group>

      {/* Ekle */}
      <Group label="Ekle">
        <div className="relative flex" ref={tableAnchor}>
          <ToolButton icon="table" label="Tablo" onClick={() => setOpenMenu(openMenu === 'table' ? null : 'table')} />
          <Popover open={openMenu === 'table'} onClose={() => setOpenMenu(null)} anchor={tableAnchor.current}>
            <div className="flex flex-col items-center gap-2 p-1">
              <div className="grid grid-cols-6 gap-0.5">
                {Array.from({ length: 36 }).map((_, i) => {
                  const r = Math.floor(i / 6) + 1;
                  const c = (i % 6) + 1;
                  const activeCell = r <= tableSize.r && c <= tableSize.c;
                  return (
                    <div
                      key={i}
                      className={`h-5 w-5 rounded-sm border ${
                        activeCell ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'
                      }`}
                      onMouseEnter={() => setTableSize({ r, c })}
                      onClick={() => {
                        exec((ch) => ch.insertTable({ rows: r, cols: c, withHeaderRow: true }));
                        setOpenMenu(null);
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-[var(--muted)]">
                {tableSize.r} × {tableSize.c}
              </span>
            </div>
          </Popover>
        </div>
        <ToolButton icon="image" label="Resim" onClick={onInsertImage} />
        <div className="relative flex" ref={linkAnchor}>
          <ToolButton icon="link" label="Bağlantı" onClick={() => setOpenMenu(openMenu === 'link' ? null : 'link')} />
          <Popover open={openMenu === 'link'} onClose={() => setOpenMenu(null)} anchor={linkAnchor.current}>
            <div className="flex w-64 flex-col gap-2 p-1">
              <input
                className="ak-input"
                placeholder="https://... veya mailto:"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    exec((c) => c.extendMarkRange('link').setLink({ href: linkUrl.trim() }));
                    setLinkUrl('');
                    setOpenMenu(null);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  className="ak-btn ak-btn-primary flex-1 !py-1.5"
                  disabled={!linkUrl.trim()}
                  onClick={() => {
                    exec((c) => c.extendMarkRange('link').setLink({ href: linkUrl.trim() }));
                    setLinkUrl('');
                    setOpenMenu(null);
                  }}
                >
                  Ekle
                </button>
                <button
                  className="ak-btn ak-btn-secondary !py-1.5"
                  onClick={() => {
                    exec((c) => c.unsetLink());
                    setOpenMenu(null);
                  }}
                >
                  Kaldır
                </button>
              </div>
            </div>
          </Popover>
        </div>
      </Group>

      {/* Sayfa */}
      <Group label="Sayfa">
        <div className="relative flex" ref={pageAnchor}>
          <ToolButton icon="page" label="Sayfa" onClick={() => setOpenMenu(openMenu === 'page' ? null : 'page')} />
          <Popover open={openMenu === 'page'} onClose={() => setOpenMenu(null)} anchor={pageAnchor.current}>
            <div className="flex w-64 flex-col gap-2.5 p-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--muted)]">Yön</span>
                <div className="flex gap-1">
                  <button
                    className={`ak-btn !px-3 !py-1.5 text-xs ${
                      doc.page.orientation === 'portrait' ? 'ak-btn-primary' : 'ak-btn-secondary'
                    }`}
                    onClick={() => onUpdateDoc({ page: { ...doc.page, orientation: 'portrait' } })}
                  >
                    Dikey
                  </button>
                  <button
                    className={`ak-btn !px-3 !py-1.5 text-xs ${
                      doc.page.orientation === 'landscape' ? 'ak-btn-primary' : 'ak-btn-secondary'
                    }`}
                    onClick={() => onUpdateDoc({ page: { ...doc.page, orientation: 'landscape' } })}
                  >
                    Yatay
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--muted)]">Kağıt Boyutu</span>
                <select
                  className="ak-select w-28"
                  value={doc.page.size}
                  onChange={(e) => onUpdateDoc({ page: { ...doc.page, size: e.target.value as DocumentState['page']['size'] } })}
                >
                  {(Object.keys(PAGE_SIZE_LABELS) as (keyof typeof PAGE_SIZE_LABELS)[]).map((k) => (
                    <option key={k} value={k}>
                      {PAGE_SIZE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--muted)]">Kenar Boşlukları</span>
                <select
                  className="ak-select w-28"
                  defaultValue="normal"
                  onChange={(e) => onUpdateDoc({ page: { ...doc.page, margins: { ...MARGIN_PRESETS[e.target.value] } } })}
                >
                  <option value="normal">Normal</option>
                  <option value="narrow">Dar</option>
                  <option value="moderate">Orta</option>
                  <option value="wide">Geniş</option>
                </select>
              </div>
              <div className="mt-1 flex gap-2 border-t border-[var(--border)] pt-2.5">
                <button
                  className={`ak-btn flex-1 !py-1.5 text-xs ${doc.header.enabled ? 'ak-btn-primary' : 'ak-btn-secondary'}`}
                  onClick={() => {
                    setHfMode('header');
                    setShowHf(true);
                  }}
                >
                  Üstbilgi
                </button>
                <button
                  className={`ak-btn flex-1 !py-1.5 text-xs ${doc.footer.enabled ? 'ak-btn-primary' : 'ak-btn-secondary'}`}
                  onClick={() => {
                    setHfMode('footer');
                    setShowHf(true);
                  }}
                >
                  Altbilgi
                </button>
              </div>
            </div>
          </Popover>
        </div>
      </Group>

      {/* Araçlar */}
      <Group label="Araçlar">
        <ToolButton icon="tools" label="PDF Araçları" active={pdfPanelOpen} onClick={onTogglePdfPanel} />
        <ToolButton icon="export-pdf" label="PDF Çıkar" onClick={onExportPdf} />
        <ToolButton icon="export-word" label="Word Çıkar" onClick={onExportWord} />
      </Group>

      {/* Görünüm */}
      <Group label="Görünüm">
        <ToolButton
          icon={theme === 'dark' ? 'sun' : 'moon'}
          label={theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          onClick={onToggleTheme}
        />
        <div className="flex items-center">
          <select className="ak-select w-16" title="Yakınlaştırma" value={zoom} onChange={(e) => onZoom(Number(e.target.value))}>
            {[50, 75, 90, 100, 125, 150, 175, 200].map((z) => (
              <option key={z} value={z}>
                %{z}
              </option>
            ))}
          </select>
        </div>
      </Group>

      {showHf && (
        <HeaderFooterModal
          mode={hfMode}
          value={hfMode === 'header' ? doc.header : doc.footer}
          onSave={(v) => {
            if (hfMode === 'header') onUpdateDoc({ header: v });
            else onUpdateDoc({ footer: v });
            setShowHf(false);
          }}
          onClose={() => setShowHf(false)}
        />
      )}
    </div>
  );
}

function HeaderFooterModal({
  mode,
  value,
  onSave,
  onClose,
}: {
  mode: 'header' | 'footer';
  value: DocumentState['header'];
  onSave: (v: DocumentState['header']) => void;
  onClose: () => void;
}): JSX.Element {
  const [enabled, setEnabled] = useState(value.enabled);
  const [text, setText] = useState(value.text);
  const [pageNumber, setPageNumber] = useState(value.pageNumber);
  const [align, setAlign] = useState<DocumentState['header']['align']>(value.align);

  return (
    <Modal
      title={mode === 'header' ? 'Üstbilgi Düzenle' : 'Altbilgi Düzenle'}
      onClose={onClose}
      footer={
        <>
          <button className="ak-btn ak-btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button className="ak-btn ak-btn-primary" onClick={() => onSave({ enabled, text, pageNumber, align })}>
            Uygula
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Etkinleştir
        </label>
        <div>
          <label className="ak-label">Metin</label>
          <input className="ak-input" value={text} placeholder="Örn: Şirket Raporu" onChange={(e) => setText(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" checked={pageNumber} onChange={(e) => setPageNumber(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Sayfa numarası ekle
        </label>
        <div>
          <label className="ak-label">Hizalama</label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                className={`ak-btn flex-1 !py-1.5 text-xs ${align === a ? 'ak-btn-primary' : 'ak-btn-secondary'}`}
                onClick={() => setAlign(a)}
              >
                {a === 'left' ? 'Sola' : a === 'center' ? 'Ortaya' : 'Sağa'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
