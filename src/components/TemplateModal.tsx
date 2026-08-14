import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';

export function TemplateModal({
  fields,
  onSubmit,
  onCancel,
}: {
  fields: string[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}): JSX.Element {
  const [values, setValues] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 20);
  }, []);

  return (
    <Modal
      title="Word Şablonu — Alan Değerleri"
      onClose={onCancel}
      footer={
        <>
          <button className="ak-btn ak-btn-secondary" onClick={onCancel}>
            Vazgeç
          </button>
          <button className="ak-btn ak-btn-primary" onClick={() => onSubmit(values)}>
            Dışa Aktar
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-[var(--muted)]">
        Belgenizde <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs">{"{{alan}}"}</code> şablon
        alanları tespit edildi. Değerleri girin:
      </p>
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <div key={f}>
            <label className="ak-label">{f}</label>
            <input
              ref={i === 0 ? firstRef : undefined}
              className="ak-input"
              value={values[f] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
              placeholder={`${f} değeri`}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
