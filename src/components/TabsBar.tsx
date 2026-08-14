import type { DocumentState } from '@/types';
import { Icon } from '@/lib/icons';

interface TabsBarProps {
  docs: DocumentState[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
}

export function TabsBar({ docs, activeId, onSelect, onClose, onNew, onRename }: TabsBarProps): JSX.Element {
  return (
    <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto bg-[var(--ribbon-bg)] px-2">
      {docs.map((doc) => {
        const active = doc.id === activeId;
        return (
          <div
            key={doc.id}
            className={`group flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
              active
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-transparent text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]'
            }`}
            onClick={() => onSelect(doc.id)}
            onDoubleClick={() => {
              const name = window.prompt('Belge adı:', doc.name);
              if (name && name.trim()) onRename(doc.id, name.trim());
            }}
            title={doc.path ?? doc.name}
          >
            <span className="max-w-[160px] truncate">{doc.name}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${!doc.dirty ? 'bg-emerald-500/70' : 'bg-amber-500'}`} />
            <button
              className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10"
              onClick={(e) => {
                e.stopPropagation();
                onClose(doc.id);
              }}
              aria-label="Sekmeyi kapat"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </div>
        );
      })}
      <button
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
        onClick={onNew}
        title="Yeni Belge (Ctrl+N)"
      >
        <Icon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}
