import { useState } from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = 'Onayla', cancelLabel = 'İptal', danger, onConfirm, onCancel }: ConfirmModalProps): JSX.Element {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="ak-btn ak-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`ak-btn ${danger ? 'ak-btn-danger' : 'ak-btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--text)]">{message}</p>
    </Modal>
  );
}

export interface PromptValue {
  text: string;
}

export function PromptModal({
  title,
  label,
  initialValue,
  placeholder,
  confirmLabel = 'Tamam',
  onConfirm,
  onCancel,
}: {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [value, setValue] = useState(initialValue ?? '');
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="ak-btn ak-btn-secondary" onClick={onCancel}>
            İptal
          </button>
          <button
            className="ak-btn ak-btn-primary"
            disabled={!value.trim()}
            onClick={() => onConfirm(value.trim())}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <label className="ak-label">{label}</label>
      <input
        className="ak-input"
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
        }}
      />
    </Modal>
  );
}

export function ConfirmCloseModal({
  name,
  onSave,
  onDiscard,
  onCancel,
}: {
  name: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}): JSX.Element {
  return (
    <Modal
      title="Kaydedilmemiş Değişiklikler"
      onClose={onCancel}
      footer={
        <>
          <button className="ak-btn ak-btn-secondary" onClick={onCancel}>
            İptal
          </button>
          <button className="ak-btn ak-btn-danger" onClick={onDiscard}>
            Kaydetme
          </button>
          <button className="ak-btn ak-btn-primary" onClick={onSave}>
            Kaydet
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--text)]">
        <span className="font-semibold">{name}</span> belgesinde kaydedilmemiş değişiklikler var.
      </p>
    </Modal>
  );
}
