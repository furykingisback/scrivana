import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useToast } from '@/lib/toast';
import { getTextItemBoxes, loadPdfDoc, renderPdfPage, type RenderedThumb, type TextItemBox } from '@/lib/pdfPreview';

const PDF_FILTER = [{ name: 'PDF Dosyası', extensions: ['pdf'] }];
const CSS_W = 760;
const RENDER_W = 1100;

interface PageEdit {
  changed: boolean;
  text: string;
  color: string;
  fontSize: number;
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function PdfEditTextModal(props: { file: string; initialPage: number; onClose: () => void }): JSX.Element {
  const { toast } = useToast();
  const [page, setPage] = useState(Math.max(1, props.initialPage));
  const [numPages, setNumPages] = useState(0);
  const [thumb, setThumb] = useState<RenderedThumb | null>(null);
  const [items, setItems] = useState<TextItemBox[]>([]);
  const [edits, setEdits] = useState<Record<string, Record<number, PageEdit>>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const docRef = useRef<import('pdfjs-dist/legacy/build/pdf').PDFDocumentProxy | null>(null);

  const pageKey = String(page);

  const load = useCallback(async () => {
    setBusy(true);
    setSelected(null);
    try {
      if (!docRef.current) {
        const res = await window.api.pdfReadFileBase64(props.file);
        if (!res.ok || !res.base64) {
          toast(res.message || 'PDF okunamadı.', 'error');
          return;
        }
        docRef.current = await loadPdfDoc(res.base64);
        setNumPages(docRef.current.numPages);
      }
      const doc = docRef.current;
      const [th, boxes] = await Promise.all([renderPdfPage(doc, page, RENDER_W), getTextItemBoxes(doc, page, RENDER_W, CSS_W)]);
      setThumb(th);
      setItems(boxes);
    } catch (err) {
      toast(`Sayfa yüklenemedi: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [page, props.file, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const cssFont = useMemo(() => (selected !== null ? (edits[pageKey]?.[selected]?.fontSize ?? items[selected]?.fontSizePt ?? 12) * (CSS_W / RENDER_W) : 0), [edits, pageKey, selected, items]);

  const getEdit = (idx: number): PageEdit => {
    const base = edits[pageKey]?.[idx];
    const item = items[idx];
    if (base) return base;
    return { changed: false, text: item?.text ?? '', color: '#111827', fontSize: item?.fontSizePt ?? 12 };
  };

  const commitEdit = (idx: number, patch: Partial<PageEdit>) => {
    setEdits((prev) => {
      const current = getEdit(idx);
      const nextText = patch.text !== undefined ? patch.text : current.text;
      const merged = { ...current, ...patch, changed: nextText.trim() !== (items[idx]?.text ?? '').trim() };
      return { ...prev, [pageKey]: { ...(prev[pageKey] ?? {}), [idx]: merged } };
    });
  };

  const selectBox = (idx: number) => {
    setSelected(idx);
    setDraft(getEdit(idx).text);
  };

  const goTo = (delta: -1 | 1) => {
    const next = page + delta;
    if (next < 1 || next > numPages) return;
    setPage(next);
  };

  const save = async () => {
    const all: Record<number, Record<number, PageEdit>> = { ...edits };
    const flat: { page: number; x: number; baseline: number; width: number; height: number; text: string; fontSize?: number; color?: string }[] = [];
    for (const [p, list] of Object.entries(all)) {
      for (const [i, e] of Object.entries(list)) {
        if (!e.changed) continue;
        const idx = Number(i);
        const item = items[idx];
        if (!item) continue;
        flat.push({
          page: Number(p),
          x: item.pdfX,
          baseline: item.pdfBaseline,
          width: item.pdfWidth,
          height: item.pdfHeight,
          text: e.text,
          fontSize: e.fontSize,
          color: e.color,
        });
      }
    }
    if (flat.length === 0) {
      toast('Değiştirilmiş metin yok.', 'error');
      return;
    }
    const out = await window.api.saveFile({ defaultName: `${basename(props.file).replace(/\.pdf$/i, '')}-duzenli.pdf`, filters: PDF_FILTER });
    if (!out) return;
    setSaving(true);
    try {
      const res = await window.api.pdfEditText(props.file, out, flat);
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedEdit = selected !== null ? getEdit(selected) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-full w-full max-w-[980px] flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-2xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-4 py-2">
          <span className="mr-2 text-xs font-semibold text-[var(--text)]">Metni Düzenle</span>
          <span className="max-w-[220px] truncate text-[10px] text-[var(--muted)]" title={props.file}>{basename(props.file)}</span>
          {selectedEdit && (
            <>
              <span className="mx-2 h-4 w-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--muted)]">Renk:</span>
              <input type="color" className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" value={selectedEdit.color} onChange={(e) => selected !== null && commitEdit(selected, { color: e.target.value })} />
              <span className="ml-2 text-[10px] text-[var(--muted)]">Boyut:</span>
              <input type="number" min={6} max={72} className="w-14 rounded border border-[var(--border)] bg-[var(--ribbon-bg)] px-1 py-0.5 text-xs text-[var(--text)]" value={selectedEdit.fontSize} onChange={(e) => selected !== null && commitEdit(selected, { fontSize: Number(e.target.value) || 12 })} />
            </>
          )}
          <div className="flex-1" />
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--hover)]" onClick={() => goTo(-1)} disabled={page <= 1}>
            <Icon name="up" className="h-3 w-3 -rotate-90" />
          </button>
          <span className="text-[10px] text-[var(--muted)]">Sayfa {page} / {numPages || '-'}</span>
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--hover)]" onClick={() => goTo(1)} disabled={page >= numPages}>
            <Icon name="down" className="h-3 w-3 -rotate-90" />
          </button>
          <span className="mx-1 h-4 w-px bg-[var(--border)]" />
          <button className="ak-btn ak-btn-primary text-xs" onClick={() => void save()} disabled={saving}>
            <Icon name="save" className="mr-1 inline h-3.5 w-3.5" />{saving ? 'Kaydediliyor…' : 'Farklı Kaydet'}
          </button>
          <button className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={props.onClose} aria-label="Kapat">
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-auto p-4" style={{ background: 'repeating-conic-gradient(#52525b 0% 25%, #3f3f46 0% 50%) 50% / 16px 16px' }}>
          {busy || !thumb ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Sayfa yükleniyor…</p>
          ) : (
            <div className="mx-auto w-fit">
              <div className="relative select-none shadow-xl" style={{ width: CSS_W, aspectRatio: `${1 / thumb.ratio}` }}>
                <img src={thumb.dataUrl} alt="Sayfa" className="h-full w-full" draggable={false} />
                {items.map((it, i) => {
                  const e = getEdit(i);
                  const isSel = selected === i;
                  const isChanged = e.changed;
                  return (
                    <div
                      key={i}
                      className={`absolute overflow-hidden rounded-sm border ${
                        isSel ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : isChanged ? 'border-amber-500' : 'border-blue-400/70'
                      } hover:border-[var(--accent)]`}
                      style={{ left: it.x, top: it.y, width: it.width, height: it.height, background: isSel ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.03)', cursor: 'text' }}
                      onClick={() => selectBox(i)}
                    >
                      {isSel ? (
                        <textarea
                          className="h-full w-full resize-none overflow-hidden bg-[rgba(255,255,255,0.95)] p-0.5 text-[var(--text)] outline-none"
                          style={{ fontSize: cssFont }}
                          value={draft}
                          autoFocus
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => selected !== null && commitEdit(selected, { text: draft })}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="block truncate px-0.5 text-[var(--text)]" style={{ fontSize: Math.max(8, e.fontSize * (CSS_W / RENDER_W)) }}>
                          {e.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs text-[var(--muted)]">
                Mavi kutular sayfa metinleridir; birine tıklayıp düzenleyin. Değişenler turuncu olur. Türkçe karakterler (İ/ı/ş/ğ/ü/ö/ç) korunarak kaydedilir.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
