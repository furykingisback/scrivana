import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useToast } from '@/lib/toast';
import { buildExportBundle } from '@/lib/htmlExport';
import { loadPdfDoc, renderPdfPage } from '@/lib/pdfPreview';
import type { DocumentState } from '@/types';

interface Thumbnail {
  dataUrl: string;
  ratio: number;
}

export function PdfThumbsPanel({
  doc,
  getHtml,
  onClose,
  onJump,
}: {
  doc: DocumentState;
  getHtml: () => string;
  onClose: () => void;
  onJump: (pageIndex: number, ratio: number) => void;
}): JSX.Element {
  const { toast } = useToast();
  const [thumbs, setThumbs] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelRef = useRef(false);

  const render = useCallback(async () => {
    const html = getHtml();
    const { html: bundleHtml, opts } = buildExportBundle(html, doc);
    cancelRef.current = false;
    setLoading(true);
    try {
      const res = await window.api.htmlToPdfBase64(bundleHtml, opts);
      if (!res.ok || !res.base64) {
        toast(res.message || 'Önizleme oluşturulamadı.', 'error');
        return;
      }
      const pdfDoc = await loadPdfDoc(res.base64);
      if (cancelRef.current) return;
      const items: Thumbnail[] = [];
      const THUMB_W = 140;
      for (let p = 1; p <= pdfDoc.numPages; p++) {
        if (cancelRef.current) return;
        const t = await renderPdfPage(pdfDoc, p, THUMB_W);
        items.push({ dataUrl: t.dataUrl, ratio: t.ratio });
      }
      if (!cancelRef.current) setThumbs(items);
    } catch (err) {
      if (!cancelRef.current) toast(`Önizleme hatası: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [doc, getHtml, toast]);

  useEffect(() => {
    void render();
    return () => {
      cancelRef.current = true;
    };
  }, [render]);

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--ribbon-bg)]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Icon name="page" className="text-[var(--accent)]" />
          Sayfa Küçük Resimleri
        </h2>
        <button className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onClose} aria-label="Kapat">
          <Icon name="close" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {loading && (
          <div className="flex flex-col items-center gap-2 py-8 text-xs text-[var(--muted)]">
            <Icon name="page" className="h-5 w-5 animate-pulse" />
            Sayfalar oluşturuluyor…
          </div>
        )}
        {!loading && thumbs.length === 0 && <div className="py-8 text-center text-xs text-[var(--muted)]">Önizleme yok</div>}
        <div className="flex flex-col gap-3">
          {thumbs.map((t, i) => (
            <button
              key={i}
              className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm transition-colors hover:border-[var(--accent)]"
              style={{ aspectRatio: String(1 / t.ratio) }}
              onClick={() => onJump(i, t.ratio)}
              title={`${i + 1}. sayfaya git`}
            >
              <img src={t.dataUrl} alt={`${i + 1}. sayfa`} className="h-full w-full object-contain" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--muted)]">
        {thumbs.length > 0 ? `${thumbs.length} sayfa` : 'Önizleme bekleniyor'}
      </div>
    </div>
  );
}
