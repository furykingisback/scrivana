import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Icon } from '@/lib/icons';
import { useToast } from '@/lib/toast';
import { loadPdfDoc, renderPdfPage, type RenderedThumb } from '@/lib/pdfPreview';
import type { PdfAnnotationSpec, PdfPageSpec } from '@/types/electron';
import { PdfEditTextModal } from './PdfEditTextModal';
import { PdfRedactModal } from './PdfRedactModal';

const PDF_FILTER = [{ name: 'PDF Dosyası', extensions: ['pdf'] }];
const THUMB_W = 160;

interface EditorPage {
  id: string;
  file: string;
  page: number;
  rotation: number;
  selected: boolean;
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

function RotatedThumb({ thumb, rotation }: { thumb: RenderedThumb; rotation: number }): JSX.Element {
  const rot = ((rotation % 360) + 360) % 360;
  const rotRatio = rot === 90 || rot === 270 ? thumb.ratio : 1 / thumb.ratio;
  const style: CSSProperties = { aspectRatio: `${rotRatio}` };
  const transform = rot === 90 ? 'rotate(90deg) scale(1.04)' : rot === 180 ? 'rotate(180deg)' : rot === 270 ? 'rotate(-90deg) scale(1.04)' : 'rotate(0deg)';
  return (
    <div className="overflow-hidden rounded-md border border-[var(--border)] bg-white" style={style}>
      <img src={thumb.dataUrl} alt="" className="h-full w-full object-cover" style={{ transform, transformOrigin: 'center' }} draggable={false} />
    </div>
  );
}

interface AnnotateTarget {
  pageId: string;
  thumb: RenderedThumb;
}

function PdfAnnotateModal(props: {
  thumb: RenderedThumb;
  initial: PdfAnnotationSpec[];
  onChange: (anns: PdfAnnotationSpec[]) => void;
  onClose: () => void;
}): JSX.Element {
  const [tool, setTool] = useState<'none' | 'text' | 'highlight'>('none');
  const [anns, setAnns] = useState<PdfAnnotationSpec[]>(props.initial);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ kind: 'draw' | 'move' | 'resize'; id?: number; sx: number; sy: number; orig?: PdfAnnotationSpec } | null>(null);

  const CSS_W = 760;
  const scale = props.thumb.pageWidthPt / CSS_W;
  const boxRatio = 1 / props.thumb.ratio;

  const commit = (next: PdfAnnotationSpec[]) => {
    setAnns(next);
    props.onChange(next);
  };

  const rel = (e: PointerEvent): { x: number; y: number } => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onBoxPointerDown = (e: PointerEvent) => {
    if (tool === 'none') return;
    e.preventDefault();
    boxRef.current?.setPointerCapture(e.pointerId);
    const p = rel(e);
    dragRef.current = { kind: 'draw', sx: p.x, sy: p.y };
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onBoxPointerMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const p = rel(e);
    if (d.kind === 'draw') {
      setDraft({
        x: Math.min(d.sx, p.x),
        y: Math.min(d.sy, p.y),
        w: Math.abs(p.x - d.sx),
        h: Math.abs(p.y - d.sy),
      });
      return;
    }
    const dx = (p.x - d.sx) * scale;
    const dy = (p.y - d.sy) * scale;
    if (!d.orig) return;
    if (d.kind === 'move') {
      commit(anns.map((a, i) => (i === d.id ? { ...a, x: d.orig!.x + dx, y: d.orig!.y + dy } : a)));
    } else {
      commit(anns.map((a, i) => (i === d.id ? { ...a, width: Math.max(12, d.orig!.width + dx), height: Math.max(12, d.orig!.height + dy) } : a)));
    }
  };

  const onBoxPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.kind === 'draw' && draft) {
      if (draft.w > 8 && draft.h > 8) {
        const spec: PdfAnnotationSpec = {
          type: tool === 'highlight' ? 'highlight' : 'text',
          x: draft.x * scale,
          y: draft.y * scale,
          width: draft.w * scale,
          height: draft.h * scale,
          text: tool === 'text' ? 'Metin' : undefined,
          fontSize: 14,
          color: tool === 'highlight' ? '#FFEB3B' : '#111827',
        };
        const next = [...anns, spec];
        commit(next);
        setSelectedId(next.length - 1);
      }
      setDraft(null);
      setTool('none');
    }
  };

  const startAnnDrag = (e: PointerEvent, id: number, kind: 'move' | 'resize', orig: PdfAnnotationSpec) => {
    e.stopPropagation();
    e.preventDefault();
    boxRef.current?.setPointerCapture(e.pointerId);
    const p = rel(e);
    dragRef.current = { kind, id, sx: p.x, sy: p.y, orig };
    setSelectedId(id);
  };

  const updateSelected = (patch: Partial<PdfAnnotationSpec>) => {
    if (selectedId === null) return;
    commit(anns.map((a, i) => (i === selectedId ? { ...a, ...patch } : a)));
  };

  const removeSelected = () => {
    if (selectedId === null) return;
    commit(anns.filter((_, i) => i !== selectedId));
    setSelectedId(null);
  };

  const COLORS = ['#111827', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#FFEB3B'];
  const selected = selectedId !== null ? anns[selectedId] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex max-h-full w-full max-w-[1000px] flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-2xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border)] px-4 py-2">
          <span className="mr-2 text-xs font-semibold text-[var(--text)]">Anotasyon Araçları</span>
          <button
            className={`rounded-md px-2 py-1 text-xs transition-colors ${tool === 'text' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}
            onClick={() => setTool((t) => (t === 'text' ? 'none' : 'text'))}
          >
            <Icon name="text-color" className="mr-1 inline h-3.5 w-3.5" />Metin Ekle
          </button>
          <button
            className={`rounded-md px-2 py-1 text-xs transition-colors ${tool === 'highlight' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:bg-[var(--hover)]'}`}
            onClick={() => setTool((t) => (t === 'highlight' ? 'none' : 'highlight'))}
          >
            <Icon name="highlight" className="mr-1 inline h-3.5 w-3.5" />Vurgu
          </button>
          {selected && (
            <>
              <span className="mx-2 h-4 w-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--muted)]">Renk:</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-4 w-4 rounded-full border ${selected.color === c ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'}`}
                  style={{ background: c }}
                  onClick={() => updateSelected({ color: c })}
                  aria-label={`Renk ${c}`}
                />
              ))}
              {selected.type === 'text' && (
                <>
                  <span className="ml-2 text-[10px] text-[var(--muted)]">Boyut:</span>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    className="w-14 rounded border border-[var(--border)] bg-[var(--ribbon-bg)] px-1 py-0.5 text-xs text-[var(--text)]"
                    value={selected.fontSize ?? 14}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) || 14 })}
                  />
                </>
              )}
              <button className="ml-1 rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--hover)] hover:text-red-500" onClick={removeSelected}>
                <Icon name="trash" className="mr-1 inline h-3.5 w-3.5" />Sil
              </button>
            </>
          )}
          <div className="flex-1" />
          <button className="ak-btn ak-btn-primary text-xs" onClick={props.onClose}>
            <Icon name="check" className="mr-1 inline h-3.5 w-3.5" />Bitti
          </button>
        </div>
        <div className="overflow-auto p-4" style={{ background: 'repeating-conic-gradient(#52525b 0% 25%, #3f3f46 0% 50%) 50% / 16px 16px' }}>
          <div className="mx-auto w-fit">
            <div
              ref={boxRef}
              className="relative touch-none select-none shadow-xl"
              style={{ width: CSS_W, aspectRatio: `${boxRatio}` }}
              onPointerDown={onBoxPointerDown}
              onPointerMove={onBoxPointerMove}
              onPointerUp={onBoxPointerUp}
              onPointerCancel={onBoxPointerUp}
            >
              <img src={props.thumb.dataUrl} alt="Sayfa" className="h-full w-full" draggable={false} />
              {draft && tool !== 'none' && (
                <div className="absolute border border-dashed border-[var(--accent)] bg-[var(--accent-soft)]/60" style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h }} />
              )}
              {anns.map((a, i) => {
                const style: CSSProperties = {
                  left: a.x / scale,
                  top: a.y / scale,
                  width: a.width / scale,
                  height: a.height / scale,
                  ...(a.type === 'highlight'
                    ? { background: a.color ?? '#FFEB3B', opacity: 0.45 }
                    : { background: 'rgba(255,255,255,0.92)' }),
                  border: selectedId === i ? '2px solid var(--accent)' : '1px solid transparent',
                };
                return (
                  <div
                    key={i}
                    className="absolute cursor-move"
                    style={style}
                    onPointerDown={(e) => startAnnDrag(e, i, 'move', a)}
                    title={a.type === 'text' ? 'Metin kutusu (sürükleyin)' : 'Vurgu'}
                  >
                    {a.type === 'text' && (selectedId === i ? (
                      <textarea
                        className="h-full w-full resize-none bg-transparent p-1 text-[var(--text)]"
                        style={{ fontSize: a.fontSize ?? 14 }}
                        value={a.text ?? ''}
                        autoFocus
                        onChange={(e) => updateSelected({ text: e.target.value })}
                        onPointerDown={(e) => e.stopPropagation()}
                        onBlur={() => setSelectedId(null)}
                      />
                    ) : (
                      <span className="block overflow-hidden p-1 text-[var(--text)]" style={{ fontSize: a.fontSize ?? 14 }}>
                        {a.text || ' '}
                      </span>
                    ))}
                    <div className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize" style={{ background: selectedId === i ? 'var(--accent)' : 'rgba(0,0,0,0.25)' }} onPointerDown={(e) => startAnnDrag(e, i, 'resize', a)} />
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-[var(--muted)]">Metin veya vurgu aracıyla sayfada sürükleyerek kutu çizin; kutuyu taşımak/sürüklemek için köşeden yeniden boyutlandırın.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PdfEditorPanel(props: { onClose: () => void; onOpenInEditor: (file: string) => void }): JSX.Element {
  const { toast } = useToast();
  const [sources, setSources] = useState<string[]>([]);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, RenderedThumb>>({});
  const [busy, setBusy] = useState(false);
  const [annotate, setAnnotate] = useState<AnnotateTarget | null>(null);
  const [annByPage, setAnnByPage] = useState<Record<string, PdfAnnotationSpec[]>>({});
  const [editText, setEditText] = useState<{ file: string; page: number } | null>(null);
  const [redact, setRedact] = useState<{ file: string; page: number } | null>(null);
  const idSeq = useRef(0);

  const nextId = () => `p${++idSeq.current}`;

  const loadFiles = useCallback(
    async (files: string[], replace: boolean) => {
      const srcs = replace ? files : [...sources, ...files];
      setSources(srcs);
      if (replace) {
        setPages([]);
        setAnnByPage({});
      }
      setBusy(true);
      const newThumbs: Record<string, RenderedThumb> = {};
      const newPages: EditorPage[] = [];
      try {
        for (const file of files) {
          const res = await window.api.pdfReadFileBase64(file);
          if (!res.ok || !res.base64) {
            toast(res.message || 'PDF okunamadı.', 'error');
            continue;
          }
          const doc = await loadPdfDoc(res.base64);
          for (let p = 1; p <= doc.numPages; p++) {
            const key = `${file}|${p}`;
            if (!thumbs[key]) newThumbs[key] = await renderPdfPage(doc, p, THUMB_W);
            newPages.push({ id: nextId(), file, page: p, rotation: 0, selected: true });
          }
        }
        setThumbs((prev) => ({ ...prev, ...newThumbs }));
        setPages((prev) => (replace ? newPages : [...prev, ...newPages]));
      } catch (err) {
        toast(`PDF yüklenemedi: ${err instanceof Error ? err.message : String(err)}`, 'error');
      } finally {
        setBusy(false);
      }
    },
    [sources, thumbs, toast],
  );

  const openPdf = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (!f) return;
    await loadFiles([f], true);
  };

  const addPdf = async () => {
    const files = await window.api.openFiles(PDF_FILTER);
    if (files && files.length > 0) await loadFiles(files, false);
  };

  const updatePage = (id: string, patch: Partial<EditorPage>) => setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const move = (i: number, dir: -1 | 1) =>
    setPages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const duplicate = (i: number) =>
    setPages((prev) => {
      const next = [...prev];
      const copy = { ...prev[i], id: nextId() };
      next.splice(i + 1, 0, copy);
      return next;
    });

  const remove = (i: number) =>
    setPages((prev) => {
      const removed = prev[i];
      setAnnByPage((a) => {
        const next = { ...a };
        delete next[removed.id];
        return next;
      });
      return prev.filter((_, j) => j !== i);
    });

  const buildSpecs = useCallback(
    (items: EditorPage[]): PdfPageSpec[] => {
      const out: PdfPageSpec[] = [];
      for (const p of items) {
        const idx = sources.indexOf(p.file);
        if (idx < 0) continue;
        const spec: PdfPageSpec = { file: idx, page: p.page, rotation: p.rotation };
        const anns = annByPage[p.id];
        if (anns && anns.length > 0) spec.annotations = anns;
        out.push(spec);
      }
      return out;
    },
    [sources, annByPage],
  );

  const saveAll = async () => {
    if (pages.length === 0) {
      toast('Düzenlenecek sayfa yok.', 'error');
      return;
    }
    const out = await window.api.saveFile({ defaultName: 'duzenlenmis.pdf', filters: PDF_FILTER });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfRebuild(sources, out, buildSpecs(pages));
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const extractSelected = async () => {
    const sel = pages.filter((p) => p.selected);
    if (sel.length === 0) {
      toast('Önce sayfa seçin (kutucuklar).', 'error');
      return;
    }
    const out = await window.api.saveFile({ defaultName: 'secili-sayfalar.pdf', filters: PDF_FILTER });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfRebuild(sources, out, buildSpecs(sel));
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const openAnnotate = async (p: EditorPage) => {
    const res = await window.api.pdfReadFileBase64(p.file);
    if (!res.ok || !res.base64) {
      toast(res.message || 'PDF okunamadı.', 'error');
      return;
    }
    const doc = await loadPdfDoc(res.base64);
    const thumb = await renderPdfPage(doc, p.page, 1100);
    setAnnotate({ pageId: p.id, thumb });
  };

  const selectedPage = pages.find((p) => p.selected);

  return (
    <div className="flex w-[360px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--ribbon-bg)]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Icon name="page" className="text-[var(--accent)]" />
          PDF Düzenle
        </h2>
        <button className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={props.onClose} aria-label="Kapat">
          <Icon name="close" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 border-b border-[var(--border)] px-3 pb-3">
        <button className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]" onClick={() => void openPdf()}>
          <Icon name="open" className="h-4 w-4" />PDF Aç
        </button>
        <button className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]" onClick={() => void addPdf()}>
          <Icon name="plus" className="h-4 w-4" />Sayfa Ekle
        </button>
        <button
          className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]"
          onClick={() => selectedPage && void openAnnotate(selectedPage)}
          title={selectedPage ? 'Seçili sayfaya metin ve vurgu ekleyin' : 'Önce bir sayfa seçin'}
        >
          <Icon name="highlight" className="h-4 w-4" />Düzenle
        </button>
        <button
          className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]"
          onClick={() => (selectedPage ? setEditText({ file: selectedPage.file, page: selectedPage.page }) : toast('Önce bir sayfa seçin.', 'error'))}
          title="Mevcut sayfa metnini tıklayıp düzeltin"
        >
          <Icon name="text-color" className="h-4 w-4" />Metin Düzenle
        </button>
        <button
          className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]"
          onClick={() => (selectedPage ? setRedact({ file: selectedPage.file, page: selectedPage.page }) : toast('Önce bir sayfa seçin.', 'error'))}
          title="Bir alan çizin, altındaki metin silinip karartılır"
        >
          <Icon name="droplet" className="h-4 w-4" />Redakte Et
        </button>
        <button className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]" onClick={() => void extractSelected()}>
          <Icon name="cut" className="h-4 w-4" />Seçili Çıkar
        </button>
        <button className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]" onClick={() => void saveAll()}>
          <Icon name="save" className="h-4 w-4" />Farklı Kaydet
        </button>
        <button
          className="ak-btn ak-btn-secondary flex flex-col items-center gap-0.5 !py-1.5 text-[10px]"
          onClick={() => sources.length > 0 && props.onOpenInEditor(sources[0])}
          title="İlk PDF&apos;in metnini editöre aktarır"
        >
          <Icon name="import" className="h-4 w-4" />Editöre Al
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {busy && <p className="text-xs text-[var(--muted)]">Sayfalar yükleniyor…</p>}
        {!busy && pages.length === 0 && (
          <p className="text-sm text-[var(--muted)]">Bir PDF açın; sayfaları sıralayabilir, döndürebilir, çoğaltabilir, silebilir, başka PDF&apos;lerden sayfa ekleyebilir ve anotasyon ekleyebilirsiniz.</p>
        )}
        {pages.length > 0 && (
          <div className="flex flex-col gap-2">
            {pages.map((p, i) => {
              const thumb = thumbs[`${p.file}|${p.page}`];
              return (
                <div key={p.id} className={`rounded-lg border p-2 ${p.selected ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="h-3.5 w-3.5" checked={p.selected} onChange={(e) => updatePage(p.id, { selected: e.target.checked })} />
                    <div className="w-16">
                      {thumb ? (
                        <RotatedThumb thumb={thumb} rotation={p.rotation} />
                      ) : (
                        <div className="aspect-[1/1.4] rounded-md border border-[var(--border)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--text)]" title={p.file}>
                        {basename(p.file)}
                      </p>
                      <p className="text-[10px] text-[var(--muted)]">Sayfa {p.page}{p.rotation ? ` · ${p.rotation}°` : ''}</p>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-0.5">
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => updatePage(p.id, { rotation: (p.rotation + 270) % 360 })} title="Sola döndür">
                      <Icon name="rotate" className="h-3.5 w-3.5 -scale-x-100" />
                    </button>
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => updatePage(p.id, { rotation: (p.rotation + 90) % 360 })} title="Sağa döndür">
                      <Icon name="rotate" className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => move(i, -1)} title="Yukarı taşı">
                      <Icon name="up" className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => move(i, 1)} title="Aşağı taşı">
                      <Icon name="down" className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={() => duplicate(i)} title="Çoğalt">
                      <Icon name="copy" className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1" />
                    <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-red-500" onClick={() => remove(i)} title="Sil">
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {pages.length > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--muted)]">
          <span>{pages.length} sayfa · {sources.length} kaynak</span>
          <span className="flex items-center gap-1"><Icon name="check" className="h-3 w-3 text-green-500" /> Yerel işlenir</span>
        </div>
      )}
      {annotate && (
        <PdfAnnotateModal
          thumb={annotate.thumb}
          initial={annByPage[annotate.pageId] ?? []}
          onChange={(anns) => setAnnByPage((prev) => ({ ...prev, [annotate.pageId]: anns }))}
          onClose={() => setAnnotate(null)}
        />
      )}
      {editText && <PdfEditTextModal file={editText.file} initialPage={editText.page} onClose={() => setEditText(null)} />}
      {redact && <PdfRedactModal file={redact.file} initialPage={redact.page} onClose={() => setRedact(null)} />}
    </div>
  );
}
