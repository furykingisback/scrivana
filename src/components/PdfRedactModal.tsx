import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useToast } from '@/lib/toast';
import { loadPdfDoc, renderPdfPage, type RenderedThumb } from '@/lib/pdfPreview';

const PDF_FILTER = [{ name: 'PDF Dosyası', extensions: ['pdf'] }];
const CSS_W = 760;
const RENDER_W = 1100;

interface RedactRectCss {
  x: number;
  y: number;
  width: number;
  height: number;
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function PdfRedactModal(props: { file: string; initialPage: number; onClose: () => void }): JSX.Element {
  const { toast } = useToast();
  const [page, setPage] = useState(Math.max(1, props.initialPage));
  const [numPages, setNumPages] = useState(0);
  const [thumb, setThumb] = useState<RenderedThumb | null>(null);
  const [rects, setRects] = useState<Record<number, RedactRectCss[]>>({});
  const [drag, setDrag] = useState<RedactRectCss | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const docRef = useRef<import('pdfjs-dist/legacy/build/pdf').PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
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
      const th = await renderPdfPage(docRef.current, page, RENDER_W);
      setThumb(th);
    } catch (err) {
      toast(`Sayfa yüklenemedi: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [page, props.file, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const localPos = (e: React.PointerEvent): { x: number; y: number } => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrag = (e: React.PointerEvent) => {
    if (!thumb) return;
    e.preventDefault();
    dragStart.current = localPos(e);
    setDrag({ x: dragStart.current.x, y: dragStart.current.y, width: 0, height: 0 });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const cur = localPos(e);
    setDrag({
      x: Math.min(dragStart.current.x, cur.x),
      y: Math.min(dragStart.current.y, cur.y),
      width: Math.abs(cur.x - dragStart.current.x),
      height: Math.abs(cur.y - dragStart.current.y),
    });
  };

  const endDrag = () => {
    if (!dragStart.current || !drag) return;
    if (drag.width > 4 && drag.height > 4) {
      setRects((prev) => ({ ...prev, [page]: [...(prev[page] ?? []), drag] }));
    }
    dragStart.current = null;
    setDrag(null);
  };

  const removeRect = (i: number) => {
    setRects((prev) => {
      const list = (prev[page] ?? []).filter((_, idx) => idx !== i);
      const next = { ...prev };
      if (list.length) next[page] = list;
      else delete next[page];
      return next;
    });
  };

  const goTo = (delta: -1 | 1) => {
    const next = page + delta;
    if (next < 1 || next > numPages) return;
    setPage(next);
  };

  const save = async () => {
    if (!thumb) return;
    const scale = thumb.pageWidthPt / CSS_W;
    const flat: { page: number; x: number; y: number; width: number; height: number }[] = [];
    for (const [p, list] of Object.entries(rects)) {
      for (const r of list) {
        flat.push({
          page: Number(p),
          x: Math.round(r.x * scale * 10) / 10,
          y: Math.round(r.y * scale * 10) / 10,
          width: Math.max(1, Math.round(r.width * scale * 10) / 10),
          height: Math.max(1, Math.round(r.height * scale * 10) / 10),
        });
      }
    }
    if (flat.length === 0) {
      toast('Karartılacak alan çizmediniz.', 'error');
      return;
    }
    const out = await window.api.saveFile({ defaultName: `${basename(props.file).replace(/\.pdf$/i, '')}-redakte.pdf`, filters: PDF_FILTER });
    if (!out) return;
    setSaving(true);
    try {
      const res = await window.api.pdfRedact(props.file, out, flat);
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const pageRects = rects[page] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-full w-full max-w-[980px] flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-2xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-4 py-2">
          <span className="mr-2 text-xs font-semibold text-[var(--text)]">Redakte Et</span>
          <span className="max-w-[220px] truncate text-[10px] text-[var(--muted)]" title={props.file}>{basename(props.file)}</span>
          <span className="mx-2 h-4 w-px bg-[var(--border)]" />
          <span className="text-[10px] text-[var(--muted)]">{pageRects.length} alan</span>
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
              <div
                ref={containerRef}
                className="relative cursor-crosshair select-none shadow-xl"
                style={{ width: CSS_W, aspectRatio: `${1 / thumb.ratio}` }}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
              >
                <img src={thumb.dataUrl} alt="Sayfa" className="h-full w-full pointer-events-none" draggable={false} />
                {pageRects.map((r, i) => (
                  <div key={i} className="absolute flex items-start justify-end bg-black p-0.5" style={{ left: r.x, top: r.y, width: r.width, height: r.height }}>
                    <button className="rounded-sm bg-red-600 px-1 text-[10px] font-bold leading-tight text-white opacity-80 hover:opacity-100" onClick={() => removeRect(i)} title="Kaldır">
                      ×
                    </button>
                  </div>
                ))}
                {drag && <div className="pointer-events-none absolute border border-red-500 bg-black/50" style={{ left: drag.x, top: drag.y, width: drag.width, height: drag.height }} />}
              </div>
              <p className="mt-2 text-center text-xs text-[var(--muted)]">Karartılacak alanı sürükleyerek çizin. Çizilen alanlardaki görünür metin PDF&apos;ten kaldırılır ve siyaha boyanır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
