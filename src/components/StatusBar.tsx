import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { DocumentState } from '@/types';
import { getPageSizeMm, PX_PER_MM } from '@/lib/utils';

interface StatusBarProps {
  editor: Editor | null;
  doc: DocumentState;
  zoom: number;
}

export function StatusBar({ editor, doc, zoom }: StatusBarProps): JSX.Element {
  const [words, setWords] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const text = editor.getText();
      setChars(text.length);
      setWords((text.trim().match(/\S+/g) ?? []).length);
    };
    update();
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  const estPages = (() => {
    const { height } = getPageSizeMm(doc.page.size, doc.page.orientation);
    const contentPx = (height - doc.page.margins.top - doc.page.margins.bottom) * PX_PER_MM;
    const linePx = 11 * 1.3333 * 1.5;
    const linesPerPage = Math.max(1, Math.floor(contentPx / linePx));
    return Math.max(1, Math.ceil(words / (linesPerPage * 12)));
  })();

  const saved = Boolean(doc.path);

  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--ribbon-bg)] px-3 text-[11px] text-[var(--muted)]">
      <div className="flex items-center gap-4">
        <span>Sayfa ~{estPages}</span>
        <span>Kelime: {words}</span>
        <span>Karakter: {chars}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${saved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {saved ? 'Kaydedildi' : 'Kaydedilmedi'}
        </span>
        <span className="max-w-[280px] truncate text-[var(--muted)]">{doc.path ?? 'Yeni Belge'}</span>
        <span className="rounded border border-[var(--border)] px-1.5 py-px">%{zoom}</span>
        <span>
          {doc.page.size} · {doc.page.orientation === 'portrait' ? 'Dikey' : 'Yatay'}
        </span>
      </div>
    </div>
  );
}
