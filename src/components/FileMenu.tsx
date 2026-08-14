import { Icon, IconName } from '@/lib/icons';

export interface FileMenuItem {
  label: string;
  icon: IconName;
  shortcut?: string;
  onClick: () => void;
  separator?: boolean;
}

interface FileMenuProps {
  items: FileMenuItem[];
  open: boolean;
  recents?: string[];
  onRecentOpen?: (p: string) => void;
  onRecentRemove?: (p: string) => void;
  onClearRecents?: () => void;
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function FileMenu({ items, open, recents = [], onRecentOpen, onRecentRemove, onClearRecents }: FileMenuProps): JSX.Element {
  if (!open) return <></>;
  return (
    <div className="ak-menu absolute left-2 top-full z-[150] mt-1 w-80 p-1.5">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`}>
          {item.separator && <div className="my-1.5 border-t border-[var(--border)]" />}
          <button className="ak-menu-item" onClick={item.onClick}>
            <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
              <Icon name={item.icon} />
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-[var(--muted)]">{item.shortcut}</span>}
          </button>
        </div>
      ))}
      {recents.length > 0 && (
        <div key="recents">
          <div className="my-1.5 border-t border-[var(--border)]" />
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Icon name="clock" className="h-3.5 w-3.5" />
              Son Açılanlar
            </span>
            {onClearRecents && (
              <button className="text-[var(--accent)] hover:underline" onClick={onClearRecents}>
                Temizle
              </button>
            )}
          </div>
          {recents.map((p) => (
            <button key={p} className="ak-menu-item" onClick={() => onRecentOpen?.(p)} title={p}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--muted)]">
                <Icon name="page" className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{basename(p)}</span>
              {onRecentRemove && (
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--muted)] hover:bg-[var(--hover)] hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecentRemove(p);
                  }}
                  title="Listeden kaldır"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
