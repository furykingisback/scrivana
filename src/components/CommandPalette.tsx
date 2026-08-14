import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, IconName } from '@/lib/icons';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: IconName;
  run: () => void;
}

export function CommandPalette({
  open,
  actions,
  onClose,
}: {
  open: boolean;
  actions: PaletteAction[];
  onClose: () => void;
}): JSX.Element | null {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return actions;
    return actions.filter((a) => `${a.label} ${a.hint ?? ''}`.toLocaleLowerCase('tr').includes(q));
  }, [actions, query]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const runAt = (i: number) => {
    const action = filtered[i];
    if (!action) return;
    onClose();
    action.run();
  };

  return (
    <div className="ak-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ak-palette" role="dialog" aria-label="Komut paleti">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4">
          <Icon name="search" className="h-4 w-4 text-[var(--muted)]" />
          <input
            ref={inputRef}
            className="ak-palette-input"
            placeholder="Komut, araç veya belge ara…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runAt(selected);
              }
            }}
          />
          <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">Esc</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">Sonuç bulunamadı</p>}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              className={`ak-menu-item w-full ${i === selected ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => runAt(i)}
            >
              <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
                <Icon name={a.icon} />
              </span>
              <span className="flex-1 text-left">{a.label}</span>
              {a.hint && <span className="text-[10px] text-[var(--muted)]">{a.hint}</span>}
            </button>
          ))}
        </div>
        <div className="border-t border-[var(--border)] px-4 py-1.5 text-[10px] text-[var(--muted)]">
          Yukarı / Aşağı gezin · Enter seç · Esc kapat
        </div>
      </div>
    </div>
  );
}
