import { useState } from 'react';
import { Icon, IconName } from '@/lib/icons';
import { useToast } from '@/lib/toast';
import { sanitizeFileName } from '@/lib/utils';

const PDF_FILTER = [{ name: 'PDF Dosyası', extensions: ['pdf'] }];

type ToolTab =
  | 'merge'
  | 'split'
  | 'security'
  | 'watermark'
  | 'convert'
  | 'ocr'
  | 'compress'
  | 'page-number'
  | 'header-footer'
  | 'organize'
  | 'page-setup'
  | 'form'
  | 'export-img'
  | 'meta'
  | 'bates'
  | 'perms'
  | 'add-field'
  | 'attach'
  | 'bookmarks'
  | 'import';

const TABS: { id: ToolTab; label: string; icon: IconName }[] = [
  { id: 'merge', label: 'Birleştir', icon: 'merge' },
  { id: 'split', label: 'Böl', icon: 'split' },
  { id: 'security', label: 'Şifre', icon: 'lock' },
  { id: 'watermark', label: 'Filigran', icon: 'droplet' },
  { id: 'convert', label: 'Dönüştür', icon: 'convert' },
  { id: 'ocr', label: 'OCR', icon: 'ocr' },
  { id: 'compress', label: 'Sıkıştır', icon: 'compress' },
  { id: 'page-number', label: 'Numara', icon: 'page-number' },
  { id: 'header-footer', label: 'Üst/Alt', icon: 'header-footer' },
  { id: 'organize', label: 'Sayfa', icon: 'organize' },
  { id: 'page-setup', label: 'Görünüm', icon: 'page-setup' },
  { id: 'form', label: 'Form', icon: 'form' },
  { id: 'export-img', label: 'Resim', icon: 'export-img' },
  { id: 'meta', label: 'Meta', icon: 'meta' },
  { id: 'bates', label: 'Bates', icon: 'bates' },
  { id: 'perms', label: 'Yetki', icon: 'lock' },
  { id: 'add-field', label: 'Alan Ekle', icon: 'form' },
  { id: 'attach', label: 'Ekler', icon: 'import' },
  { id: 'bookmarks', label: 'Yer İmleri', icon: 'page' },
  { id: 'import', label: 'İçe Aktar', icon: 'import' },
];

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

export function PdfToolsPanel({ onClose, onImport }: { onClose: () => void; onImport: () => void }): JSX.Element {
  const [tab, setTab] = useState<ToolTab>('merge');
  const { toast } = useToast();

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--ribbon-bg)]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Icon name="tools" className="text-[var(--accent)]" />
          PDF Araçları
        </h2>
        <button className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onClose} aria-label="Kapat">
          <Icon name="close" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1 border-b border-[var(--border)] px-3 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition-colors ${
              tab === t.id ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]' : 'text-[var(--muted)] hover:bg-[var(--hover)]'
            }`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'merge' && <MergeTool />}
        {tab === 'split' && <SplitTool />}
        {tab === 'security' && <SecurityTool />}
        {tab === 'watermark' && <WatermarkTool />}
        {tab === 'convert' && <ConvertTool />}
        {tab === 'ocr' && <OcrTool />}
        {tab === 'compress' && <CompressTool />}
        {tab === 'page-number' && <PageNumberTool />}
        {tab === 'header-footer' && <HeaderFooterTool />}
        {tab === 'organize' && <OrganizeTool />}
        {tab === 'page-setup' && <PageSetupTool />}
        {tab === 'form' && <FormTool />}
        {tab === 'export-img' && <ExportImagesTool />}
        {tab === 'meta' && <MetadataTool />}
        {tab === 'bates' && <BatesTool />}
        {tab === 'perms' && <PermissionsTool />}
        {tab === 'add-field' && <AddFormFieldTool />}
        {tab === 'attach' && <AttachFileTool />}
        {tab === 'bookmarks' && <BookmarksTool />}
        {tab === 'import' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--muted)]">
              Word (.docx), TXT, Markdown veya PDF dosyalarını editöre aktarın ve düzenlemeye başlayın.
            </p>
            <button className="ak-btn ak-btn-primary" onClick={onImport}>
              <Icon name="import" /> Belge İçe Aktar
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--muted)]">
        Tüm işlemler tamamen yerel olarak çalışır; dosyalar bilgisayarınızdan çıkmaz.
      </div>
    </div>
  );
}

function FileListItem({ path, onUp, onDown, onRemove }: { path: string; onUp: () => void; onDown: () => void; onRemove: () => void }): JSX.Element {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
      <Icon name="export-pdf" className="h-4 w-4 shrink-0 text-red-500/80" />
      <span className="min-w-0 flex-1 truncate text-xs text-[var(--text)]" title={path}>
        {basename(path)}
      </span>
      <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onUp} title="Yukarı taşı">
        <Icon name="up" className="h-3.5 w-3.5" />
      </button>
      <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]" onClick={onDown} title="Aşağı taşı">
        <Icon name="down" className="h-3.5 w-3.5" />
      </button>
      <button className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-red-500" onClick={onRemove} title="Kaldır">
        <Icon name="trash" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MergeTool(): JSX.Element {
  const { toast } = useToast();
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const picked = await window.api.openFiles(PDF_FILTER);
    if (picked) setFiles((prev) => [...prev, ...picked]);
  };

  const merge = async () => {
    if (files.length < 2) {
      toast('Birleştirmek için en az 2 PDF seçin.', 'error');
      return;
    }
    const out = await window.api.saveFile({ defaultName: 'birlesik.pdf', filters: PDF_FILTER });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfMerge(files, out);
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Birden fazla PDF&apos;i sırasıyla tek bir dosyada birleştirin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void add()}>
        <Icon name="plus" /> PDF Ekle
      </button>
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((f, i) => (
            <FileListItem
              key={f}
              path={f}
              onUp={() => move(i, -1)}
              onDown={() => move(i, 1)}
              onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || files.length < 2} onClick={() => void merge()}>
        {busy ? 'İşleniyor…' : 'Birleştir ve Kaydet'}
      </button>
    </div>
  );
}

function SplitTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [ranges, setRanges] = useState('1-3, 5, 7-9');
  const [dir, setDir] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (!f) return;
    setFile(f);
    setTotal(null);
    const count = await window.api.pdfPageCount(f);
    setTotal(count);
  };

  const run = async () => {
    if (!file || !dir) {
      toast('PDF dosyası ve çıktı klasörü seçin.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await window.api.pdfSplit(file, [ranges], dir);
      if (res.ok) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(dir) });
      else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Sayfa aralıklarını belirtin: <code className="rounded bg-[var(--surface-2)] px-1">1-3, 5, 7-9</code></p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">
          <div className="truncate">{basename(file)}</div>
          <div className="text-[var(--muted)]">{total !== null ? `${total} sayfa` : 'Sayfa sayısı hesaplanıyor…'}</div>
        </div>
      )}
      <div>
        <label className="ak-label">Sayfa Aralıkları</label>
        <input className="ak-input" value={ranges} onChange={(e) => setRanges(e.target.value)} />
      </div>
      <button className="ak-btn ak-btn-secondary" onClick={() => void window.api.openDirectory().then((d) => d && setDir(d))}>
        <Icon name="folder" /> Çıktı Klasörü {dir && <span className="ml-1 truncate text-[var(--muted)]">({basename(dir)})</span>}
      </button>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'İşleniyor…' : 'Sayfalara Böl'}
      </button>
    </div>
  );
}

function SecurityTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'enc' | 'dec' | null>(null);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const encrypt = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (password.length < 4) return toast('En az 4 karakterlik bir şifre girin.', 'error');
    const out = await window.api.saveFile({ defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-sifreli.pdf`, filters: PDF_FILTER });
    if (!out) return;
    setBusy('enc');
    try {
      const res = await window.api.pdfEncrypt(file, out, password);
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const decrypt = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({ defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-sifresiz.pdf`, filters: PDF_FILTER });
    if (!out) return;
    setBusy('dec');
    try {
      const res = await window.api.pdfDecrypt(file, out, password);
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF&apos;inize şifre ekleyin veya mevcut şifreyi kaldırın.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Şifre</label>
        <input className="ak-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifrenizi girin" />
      </div>
      <div className="flex gap-2">
        <button className="ak-btn ak-btn-primary flex-1 disabled:opacity-60" disabled={busy !== null} onClick={() => void encrypt()}>
          <Icon name="lock" /> Şifrele
        </button>
        <button className="ak-btn ak-btn-secondary flex-1 disabled:opacity-60" disabled={busy !== null} onClick={() => void decrypt()}>
          <Icon name="unlock" /> Kaldır
        </button>
      </div>
    </div>
  );
}

function WatermarkTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [text, setText] = useState('GİZLİ');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [color, setColor] = useState('#94a3b8');
  const [rotate, setRotate] = useState(45);
  const [repeat, setRepeat] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({ defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-filigranli.pdf`, filters: PDF_FILTER });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfWatermark(file, out, { text, fontSize, opacity, color, rotate, repeat });
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Tüm sayfalara metin filigranı basın.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Filigran Metni</label>
        <input className="ak-input" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div>
        <label className="ak-label">Boyut: {fontSize}</label>
        <input type="range" min={12} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
      </div>
      <div>
        <label className="ak-label">Opaklık: %{Math.round(opacity * 100)}</label>
        <input type="range" min={5} max={100} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full accent-[var(--accent)]" />
      </div>
      <div>
        <label className="ak-label">Dönüş: {rotate}°</label>
        <input type="range" min={0} max={90} value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
      </div>
      <div className="flex items-center gap-3">
        <div>
          <label className="ak-label">Renk</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-14 cursor-pointer" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Sayfayı doldur (tekrarla)
        </label>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !text.trim()} onClick={() => void run()}>
        {busy ? 'İşleniyor…' : 'Filigran Uygula'}
      </button>
    </div>
  );
}

const OCR_LANGUAGES = [
  { code: 'tur', label: 'Türkçe' },
  { code: 'eng', label: 'İngilizce' },
  { code: 'tur+eng', label: 'Türkçe + İngilizce' },
];

function OcrTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [language, setLanguage] = useState('tur');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const langLabel = OCR_LANGUAGES.find((l) => l.code === language)?.label ?? language;
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-ocr.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfOcr(file, out, { language });
      if (res.ok && res.output) {
        toast(`${res.message} (${langLabel})`, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">
        Taranmış PDF&apos;leri OCR ile işleyerek aranabilir ve kopyalanabilir metin katmanı ekleyin.
      </p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">OCR Dili</label>
        <select className="ak-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {OCR_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Taranıyor…' : 'OCR ile Tara'}
      </button>
    </div>
  );
}

const PAGE_NUMBER_POSITIONS: { id: string; label: string }[] = [
  { id: 'top-left', label: 'Sol Üst' },
  { id: 'top-center', label: 'Orta Üst' },
  { id: 'top-right', label: 'Sağ Üst' },
  { id: 'bottom-left', label: 'Sol Alt' },
  { id: 'bottom-center', label: 'Orta Alt' },
  { id: 'bottom-right', label: 'Sağ Alt' },
];

function CompressTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.6);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
      const out = await window.api.saveFile({
        defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-sikistirilmis.pdf`,
        filters: PDF_FILTER,
      });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfCompress(file, out, { quality });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">
        Büyük görselleri yeniden kodlayarak PDF boyutunu küçültün.
      </p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Sıkıştırma Oranı: %{Math.round(quality * 100)}</label>
        <input type="range" min={10} max={100} value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full accent-[var(--accent)]" />
        <p className="mt-1 text-[10px] text-[var(--muted)]">Daha düşük değer daha küçük dosya, daha yüksek değer daha iyi kalite anlamına gelir.</p>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Sıkıştırılıyor…' : 'PDF Sıkıştır'}
      </button>
    </div>
  );
}

function PageNumberTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [start, setStart] = useState(1);
  const [position, setPosition] = useState('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState('{n}/{total}');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-numarali.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfPageNumbers(file, out, { start, position, fontSize, format });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Tüm sayfalara numara ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="ak-label">Başlangıç No</label>
          <input className="ak-input" type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} />
        </div>
        <div>
          <label className="ak-label">Boyut: {fontSize}</label>
          <input type="range" min={8} max={24} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div>
        <label className="ak-label">Konum</label>
        <select className="ak-input" value={position} onChange={(e) => setPosition(e.target.value)}>
          {PAGE_NUMBER_POSITIONS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="ak-label">Biçim</label>
        <input className="ak-input" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="{n} veya {n}/{total}" />
        <p className="mt-1 text-[10px] text-[var(--muted)]"><code className="rounded bg-[var(--surface-2)] px-1">{'{n}'}</code> sayfa numarası, <code className="rounded bg-[var(--surface-2)] px-1">{'{total}'}</code> toplam sayfa</p>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Numaralanıyor…' : 'Numara Ekle'}
      </button>
    </div>
  );
}

function HeaderFooterTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [fontSize, setFontSize] = useState(11);
  const [color, setColor] = useState('#4b5563');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (!header.trim() && !footer.trim()) return toast('Üst bilgi veya alt bilgi metni girin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-ustalt.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfHeaderFooter(file, out, { header, footer, fontSize, color });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Tüm sayfalara üst ve/veya alt bilgi ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Üst Bilgi</label>
        <input className="ak-input" value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Üst bilgi metni" />
      </div>
      <div>
        <label className="ak-label">Alt Bilgi</label>
        <input className="ak-input" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Alt bilgi metni" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="ak-label">Boyut: {fontSize}</label>
          <input type="range" min={8} max={18} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label className="ak-label">Renk</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full cursor-pointer" />
        </div>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Ekleniyor…' : 'Üst/Alt Bilgi Ekle'}
      </button>
    </div>
  );
}

function ConvertTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const toWord = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({ defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}.docx`, filters: [{ name: 'Word Belgesi', extensions: ['docx'] }] });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfToWord(file, out);
      if (res.ok && res.output) toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      else toast(res.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF&apos;teki metni ayıklayıp düzenlenebilir Word belgesine dönüştürün.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void toWord()}>
        <Icon name="convert" /> {busy ? 'İşleniyor…' : 'PDF → Word Dönüştür'}
      </button>
    </div>
  );
}

function OrganizeTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [pages, setPages] = useState<{ orig: number; deg: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (!f) return;
    setFile(f);
    const count = await window.api.pdfPageCount(f);
    setPages(Array.from({ length: count }, (_, i) => ({ orig: i + 1, deg: 0 })));
  };

  const move = (i: number, dir: -1 | 1) => {
    setPages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const rotate = (i: number) => {
    setPages((prev) => prev.map((p, idx) => (idx === i ? { ...p, deg: (p.deg + 90) % 360 } : p)));
  };

  const remove = (i: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (!pages.length) return toast('En az bir sayfa kalmalı.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-duzenlendi.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const rotateMap: Record<string, number> = {};
      for (const p of pages) if (p.deg) rotateMap[String(p.orig)] = p.deg;
      const res = await window.api.pdfOrganize(file, out, { order: pages.map((p) => p.orig), rotate: rotateMap });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Sayfaları silin, yeniden sıralayın ve 90° döndürün.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      {pages.length > 0 && (
        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
          {pages.map((p, i) => (
            <div key={`${p.orig}-${i}`} className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
              <span className="min-w-0 flex-1 text-xs text-[var(--text)]">
                Sayfa {p.orig}
                {p.deg ? <span className="ml-1 text-[var(--accent)]">{p.deg}°</span> : null}
              </span>
              <button className="rounded p-1 text-[var(--muted)] hover:text-[var(--text)]" onClick={() => move(i, -1)} title="Yukarı taşı">
                <Icon name="up" className="h-3.5 w-3.5" />
              </button>
              <button className="rounded p-1 text-[var(--muted)] hover:text-[var(--text)]" onClick={() => move(i, 1)} title="Aşağı taşı">
                <Icon name="down" className="h-3.5 w-3.5" />
              </button>
              <button className="rounded p-1 text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => rotate(i)} title="90° döndür">
                <Icon name="rotate" className="h-3.5 w-3.5" />
              </button>
              <button className="rounded p-1 text-[var(--muted)] hover:text-red-500" onClick={() => remove(i)} title="Sayfayı sil">
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'İşleniyor…' : 'Uygula ve Kaydet'}
      </button>
    </div>
  );
}

const PAGE_PRESETS = [
  { id: 'A4', label: 'A4 (210×297 mm)' },
  { id: 'Letter', label: 'Letter (216×279 mm)' },
  { id: 'A5', label: 'A5 (148×210 mm)' },
];

const IMAGE_FILTER = [{ name: 'Görseller', extensions: ['png', 'jpg', 'jpeg'] }];

function PageSetupTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [preset, setPreset] = useState('A4');
  const [bgEnabled, setBgEnabled] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(100);
  const [busy, setBusy] = useState<'size' | 'bg' | null>(null);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const applySize = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-boyut-${preset}.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy('size');
    try {
      const res = await window.api.pdfPageSize(file, out, { preset });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  const applyBg = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (!bgEnabled) return toast('Arka plan eklemeyi açın.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-zemin.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy('bg');
    try {
      const res = await window.api.pdfBackground(file, out, { color: bgColor, opacity: opacity / 100, imagePath: bgImage ?? undefined });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Sayfa boyutunu değiştirin ve tüm sayfalara arka plan ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}

      <div className="rounded-lg border border-[var(--border)] p-3">
        <h3 className="mb-2 text-xs font-semibold text-[var(--text)]">Sayfa Boyutu</h3>
        <div>
          <label className="ak-label">Hazır Boyut</label>
          <select className="ak-input" value={preset} onChange={(e) => setPreset(e.target.value)}>
            {PAGE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">İçerik konumu korunur; daha küçük boyutta içerik kırpılabilir.</p>
        <button className="ak-btn ak-btn-primary mt-2 w-full disabled:opacity-60" disabled={busy !== null} onClick={() => void applySize()}>
          {busy === 'size' ? 'Uygulanıyor…' : 'Boyutu Uygula'}
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] p-3">
        <h3 className="mb-2 text-xs font-semibold text-[var(--text)]">Arka Plan</h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
          <input type="checkbox" checked={bgEnabled} onChange={(e) => setBgEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Arka plan ekle
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="ak-label">Renk</label>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-full cursor-pointer" />
          </div>
          <div>
            <label className="ak-label">Opaklık: %{opacity}</label>
            <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="mt-2">
          <label className="ak-label">Görsel (isteğe bağlı)</label>
          <button className="ak-btn ak-btn-secondary w-full" onClick={() => void window.api.openFile(IMAGE_FILTER).then((f) => f && setBgImage(f))}>
            <Icon name="image" /> {bgImage ? basename(bgImage) : 'Görsel Seç'}
          </button>
          {bgImage && (
            <button className="mt-1 w-full text-left text-[10px] text-red-400 hover:underline" onClick={() => setBgImage(null)}>
              Görseli kaldır
            </button>
          )}
        </div>
        <button className="ak-btn ak-btn-primary mt-2 w-full disabled:opacity-60" disabled={busy !== null || !bgEnabled} onClick={() => void applyBg()}>
          {busy === 'bg' ? 'Uygulanıyor…' : 'Arka Planı Uygula'}
        </button>
      </div>
    </div>
  );
}

interface FormFieldView {
  name: string;
  type: string;
  value?: string;
  options?: string[];
  readOnly: boolean;
}

const SIGN_POSITIONS: { id: string; label: string }[] = [
  { id: 'bottom-left', label: 'Sol Alt' },
  { id: 'bottom-center', label: 'Orta Alt' },
  { id: 'bottom-right', label: 'Sağ Alt' },
  { id: 'top-left', label: 'Sol Üst' },
  { id: 'top-center', label: 'Orta Üst' },
  { id: 'top-right', label: 'Sağ Üst' },
];

function FormTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [fields, setFields] = useState<FormFieldView[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [flatten, setFlatten] = useState(false);
  const [busy, setBusy] = useState<'list' | 'fill' | 'sign' | null>(null);
  const [page, setPage] = useState(1);
  const [signText, setSignText] = useState('İmza');
  const [signImage, setSignImage] = useState<string | null>(null);
  const [signPos, setSignPos] = useState('bottom-right');
  const [signSize, setSignSize] = useState(24);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (!f) return;
    setFile(f);
    setFields(null);
    setValues({});
  };

  const listFields = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    setBusy('list');
    try {
      const res = await window.api.pdfListFormFields(file);
      if (res.ok && res.fields) {
        setFields(res.fields);
        const init: Record<string, string> = {};
        for (const f of res.fields) if (f.value !== undefined) init[f.name] = f.value;
        setValues(init);
        toast(res.message, 'success');
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  const setValue = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));

  const fieldInput = (f: FormFieldView) => {
    if (f.readOnly) return <span className="text-[10px] text-[var(--muted)]">Salt okunur</span>;
    if (f.type === 'checkbox') {
      const on = values[f.name] === 'on';
      return (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
          <input type="checkbox" checked={on} onChange={(e) => setValue(f.name, e.target.checked ? 'on' : 'off')} className="h-4 w-4 accent-[var(--accent)]" />
          {on ? 'İşaretli' : 'Boş'}
        </label>
      );
    }
    if (f.type === 'radio' || f.type === 'dropdown' || f.type === 'option-list') {
      return (
        <select className="ak-input" value={values[f.name] ?? ''} onChange={(e) => setValue(f.name, e.target.value)}>
          <option value="">Seçin…</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }
    return <input className="ak-input" value={values[f.name] ?? ''} onChange={(e) => setValue(f.name, e.target.value)} />;
  };

  const fill = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-dolduruldu.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy('fill');
    try {
      const res = await window.api.pdfFillForm(file, out, { values, flatten });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  const sign = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (!signText.trim() && !signImage) return toast('İmza metni veya görseli belirtin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-imzali.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy('sign');
    try {
      const res = await window.api.pdfSign(file, out, {
        page,
        text: signImage ? undefined : signText,
        imagePath: signImage ?? undefined,
        position: signPos,
        fontSize: signSize,
      });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Form alanlarını doldurun ve PDF&apos;e imza ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}

      <div className="rounded-lg border border-[var(--border)] p-3">
        <h3 className="mb-2 text-xs font-semibold text-[var(--text)]">Form Doldur</h3>
        <button className="ak-btn ak-btn-secondary w-full disabled:opacity-60" disabled={busy !== null || !file} onClick={() => void listFields()}>
          <Icon name="search" /> {busy === 'list' ? 'Taranıyor…' : 'Form Alanlarını Listele'}
        </button>
        {fields && fields.length === 0 && <p className="mt-2 text-xs text-[var(--muted)]">Bu PDF&apos;te form alanı bulunamadı.</p>}
        {fields && fields.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="ak-label">
                  {f.name}
                  <span className="ml-1 text-[var(--muted)]">({f.type})</span>
                </label>
                {fieldInput(f)}
              </div>
            ))}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
              <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
              Doldurulan alanları kalıcı hale getir (düzleştir)
            </label>
            <button className="ak-btn ak-btn-primary w-full disabled:opacity-60" disabled={busy !== null} onClick={() => void fill()}>
              {busy === 'fill' ? 'Dolduruluyor…' : 'Doldur ve Kaydet'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] p-3">
        <h3 className="mb-2 text-xs font-semibold text-[var(--text)]">İmza Ekle</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="ak-label">Sayfa</label>
            <input className="ak-input" type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value))} />
          </div>
          <div>
            <label className="ak-label">Boyut: {signSize}</label>
            <input type="range" min={10} max={48} value={signSize} onChange={(e) => setSignSize(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="mt-2">
          <label className="ak-label">Konum</label>
          <select className="ak-input" value={signPos} onChange={(e) => setSignPos(e.target.value)}>
            {SIGN_POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="mt-2">
          <label className="ak-label">İmza Metni</label>
          <input className="ak-input" value={signText} onChange={(e) => setSignText(e.target.value)} placeholder="İmza metni" />
        </div>
        <div className="mt-2">
          <label className="ak-label">İmza Görseli (isteğe bağlı)</label>
          <button className="ak-btn ak-btn-secondary w-full" onClick={() => void window.api.openFile(IMAGE_FILTER).then((f) => f && setSignImage(f))}>
            <Icon name="image" /> {signImage ? basename(signImage) : 'Görsel Seç'}
          </button>
          {signImage && (
            <button className="mt-1 w-full text-left text-[10px] text-red-400 hover:underline" onClick={() => setSignImage(null)}>
              Görseli kaldır
            </button>
          )}
        </div>
        <button className="ak-btn ak-btn-primary mt-2 w-full disabled:opacity-60" disabled={busy !== null || !file} onClick={() => void sign()}>
          {busy === 'sign' ? 'İmzalanıyor…' : 'İmza Ekle'}
        </button>
      </div>
    </div>
  );
}

function ExportImagesTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const dir = await window.api.openDirectory();
    if (!dir) return;
    setBusy(true);
    try {
      const res = await window.api.pdfExportImages(file, dir, { format, scale });
      if (res.ok && res.outputs) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(dir) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF sayfalarını yüksek kaliteli PNG veya JPEG görsellere dönüştürün.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Biçim</label>
        <select className="ak-input" value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}>
          <option value="png">PNG (Yüksek Kalite)</option>
          <option value="jpeg">JPEG (Sıkıştırılmış)</option>
        </select>
      </div>
      <div>
        <label className="ak-label">Ölçek (Çözünürlük): {scale}x</label>
        <input type="range" min={1} max={4} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Dışa Aktarılıyor…' : 'Görselleri Dışa Aktar'}
      </button>
    </div>
  );
}

function MetadataTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (!f) return;
    setFile(f);
    const res = await window.api.pdfGetMetadata(f);
    if (res.ok && res.metadata) {
      setTitle(res.metadata.title ?? '');
      setAuthor(res.metadata.author ?? '');
      setSubject(res.metadata.subject ?? '');
      setKeywords((res.metadata.keywords ?? []).join(', '));
    }
  };

  const save = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-meta.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const kwList = keywords.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await window.api.pdfSetMetadata(file, out, { title, author, subject, keywords: kwList });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF meta verilerini (Başlık, Yazar, Konu, Anahtar Kelimeler) görüntüleyin ve düzenleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Başlık (Title)</label>
        <input className="ak-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Belge başlığı" />
      </div>
      <div>
        <label className="ak-label">Yazar (Author)</label>
        <input className="ak-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Yazar adı" />
      </div>
      <div>
        <label className="ak-label">Konu (Subject)</label>
        <input className="ak-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu açıklaması" />
      </div>
      <div>
        <label className="ak-label">Anahtar Kelimeler (virgülle ayırın)</label>
        <input className="ak-input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="rapor, mali, 2026" />
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void save()}>
        {busy ? 'Kaydediliyor…' : 'Meta Verileri Kaydet'}
      </button>
    </div>
  );
}

function BatesTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('DOC-');
  const [start, setStart] = useState(1);
  const [digits, setDigits] = useState(6);
  const [position, setPosition] = useState('bottom-right');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-bates.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfBatesNumbering(file, out, { prefix, start, digits, position });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">Hukuki ve resmi belgeler için ardışık Bates seri numarası ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="ak-label">Ön Ek (Prefix)</label>
          <input className="ak-input" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </div>
        <div>
          <label className="ak-label">Başlangıç No</label>
          <input className="ak-input" type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="ak-label">Basamak (Digits): {digits}</label>
          <input type="range" min={2} max={8} value={digits} onChange={(e) => setDigits(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label className="ak-label">Konum</label>
          <select className="ak-input" value={position} onChange={(e) => setPosition(e.target.value)}>
            {SIGN_POSITIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Ekleniyor…' : 'Bates Numarası Ekle'}
      </button>
    </div>
  );
}

function PermissionsTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [printing, setPrinting] = useState<'high' | 'low' | 'none'>('high');
  const [modifying, setModifying] = useState(false);
  const [copying, setCopying] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('owner123');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-kısıtlı.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfPermissions(file, out, { printing, modifying, copying, ownerPassword });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF yazdırma, içerik kopyalama ve değiştirme yetkilerini kısıtlayın.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div>
        <label className="ak-label">Yazdırma İzni</label>
        <select className="ak-input" value={printing} onChange={(e) => setPrinting(e.target.value as 'high' | 'low' | 'none')}>
          <option value="high">Yüksek Çözünürlük (Serbest)</option>
          <option value="low">Düşük Çözünürlük</option>
          <option value="none">Yasakla</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
          <input type="checkbox" checked={modifying} onChange={(e) => setModifying(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Belgeyi Değiştirmeye İzin Ver
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
          <input type="checkbox" checked={copying} onChange={(e) => setCopying(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Metin ve Görsel Kopyalamaya İzin Ver
        </label>
      </div>
      <div>
        <label className="ak-label">Yönetici Şifresi (Owner Password)</label>
        <input className="ak-input" type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Uygulanıyor…' : 'Yetkileri Uygula'}
      </button>
    </div>
  );
}

function AddFormFieldTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'text' | 'checkbox' | 'dropdown'>('text');
  const [name, setName] = useState('yeni_alan');
  const [defaultValue, setDefaultValue] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-formlu.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfAddFormField(file, out, { page, type, name, defaultValue, x: 72, y: 700, width: 200, height: 28 });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF sayfasına yeni bir etkileşimli form alanı (metin kutusu, onay kutusu vb.) ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="ak-label">Sayfa</label>
          <input className="ak-input" type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value))} />
        </div>
        <div>
          <label className="ak-label">Tür</label>
          <select className="ak-input" value={type} onChange={(e) => setType(e.target.value as 'text' | 'checkbox' | 'dropdown')}>
            <option value="text">Metin Kutusu</option>
            <option value="checkbox">Onay Kutusu</option>
            <option value="dropdown">Açılır Liste</option>
          </select>
        </div>
      </div>
      <div>
        <label className="ak-label">Alan Adı (Field Name)</label>
        <input className="ak-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="ak-label">Varsayılan Değer</label>
        <input className="ak-input" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} />
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file} onClick={() => void run()}>
        {busy ? 'Ekleniyor…' : 'Form Alanı Ekle'}
      </button>
    </div>
  );
}

function AttachFileTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [attFile, setAttFile] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const pickAtt = async () => {
    const f = await window.api.openFile([]);
    if (f) setAttFile(f);
  };

  const run = async () => {
    if (!file) return toast('Önce ana PDF dosyasını seçin.', 'error');
    if (!attFile) return toast('İliştirilecek dosyayı seçin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-ekli.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfAttachFile(file, out, { filePath: attFile, description });
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF içerisine herhangi bir harici dosya (XML, PDF, resim vb.) ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> Ana PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}
      <button className="ak-btn ak-btn-secondary" onClick={() => void pickAtt()}>
        <Icon name="import" /> {attFile ? basename(attFile) : 'Eklenecek Dosyayı Seç'}
      </button>
      <div>
        <label className="ak-label">Açıklama (Description)</label>
        <input className="ak-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dosya açıklaması" />
      </div>
      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file || !attFile} onClick={() => void run()}>
        {busy ? 'Ekleniyor…' : 'Dosyayı İliştir'}
      </button>
    </div>
  );
}

function BookmarksTool(): JSX.Element {
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<{ title: string; page: number }[]>([
    { title: 'Giriş Bölümü', page: 1 },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newPage, setNewPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const f = await window.api.openFile(PDF_FILTER);
    if (f) setFile(f);
  };

  const addBookmark = () => {
    if (!newTitle.trim()) return toast('Yer imi başlığı girin.', 'error');
    setBookmarks((prev) => [...prev, { title: newTitle.trim(), page: Math.max(1, newPage) }]);
    setNewTitle('');
  };

  const removeBookmark = (index: number) => {
    setBookmarks((prev) => prev.filter((_, i) => i !== index));
  };

  const run = async () => {
    if (!file) return toast('Önce bir PDF seçin.', 'error');
    if (!bookmarks.length) return toast('En az bir yer imi ekleyin.', 'error');
    const out = await window.api.saveFile({
      defaultName: `${sanitizeFileName(basename(file)).replace('.pdf', '')}-yerimleri.pdf`,
      filters: PDF_FILTER,
    });
    if (!out) return;
    setBusy(true);
    try {
      const res = await window.api.pdfSetBookmarks(file, out, bookmarks);
      if (res.ok && res.output) {
        toast(res.message, 'success', { label: 'Klasörü Aç', onClick: () => void window.api.openPath(res.output as string) });
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted)]">PDF belgesine sol kenar çubuğu için tıklanabilir yer imleri (Outlines) ekleyin.</p>
      <button className="ak-btn ak-btn-secondary" onClick={() => void pick()}>
        <Icon name="export-pdf" /> PDF Seç
      </button>
      {file && <div className="truncate rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--text)]">{basename(file)}</div>}

      <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3">
        <h3 className="text-xs font-semibold text-[var(--text)]">Yer İmi Ekle</h3>
        <div>
          <label className="ak-label">Başlık</label>
          <input className="ak-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Örn: 1. Bölüm" />
        </div>
        <div>
          <label className="ak-label">Sayfa No</label>
          <input className="ak-input" type="number" min={1} value={newPage} onChange={(e) => setNewPage(Number(e.target.value))} />
        </div>
        <button className="ak-btn ak-btn-secondary mt-1" onClick={addBookmark}>
          <Icon name="plus" /> Listeye Ekle
        </button>
      </div>

      {bookmarks.length > 0 && (
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          {bookmarks.map((b, i) => (
            <div key={i} className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]">
              <span className="min-w-0 flex-1 truncate">{b.title} (Sayfa {b.page})</span>
              <button className="rounded p-1 text-[var(--muted)] hover:text-red-500" onClick={() => removeBookmark(i)} title="Kaldır">
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="ak-btn ak-btn-primary disabled:opacity-60" disabled={busy || !file || !bookmarks.length} onClick={() => void run()}>
        {busy ? 'Ekleniyor…' : 'Yer İmlerini Kaydet'}
      </button>
    </div>
  );
}
