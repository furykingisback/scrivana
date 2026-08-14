# Contributing to Scrivana

Scrivana'ya katkıda bulunduğun için teşekkürler! Bu belge katkı sürecini açıklar.

## Nasıl Katkı Sağlanır

### 1. Hata Bildirimi (Bug Report)

- [Issue sayfasından](https://github.com/furykingisback/scrivana/issues/new?template=bug_report.md) yeni bir issue aç
- Hatanın nasıl oluştuğunu adım adım anlat
- Beklenen ve gerçek davranışı belirt
- Ekran görüntüsü veya log varsa ekle

### 2. Özellik Önerisi (Feature Request)

- [Issue sayfasından](https://github.com/furykingisback/scrivana/issues/new?template=feature_request.md) yeni bir issue aç
- Hangi sorunu çözdüğünü açıkla
- Örnek kullanım senaryosu ver

### 3. Kod Katkısı

1. Depoyu fork et
2. Yeni bir dal (branch) oluştur: `git checkout -b ozellik/adin-ozelligin`
3. Değişiklikleri yap
4. Testleri çalıştır: `npm test && npm run test:e2e`
5. Tip kontrolünden geçir: `npm run typecheck`
6. Pull request aç

## Geliştirme Ortamı

### Gereksinimler

- Node.js 18+
- npm 9+
- Windows 10/11 (64-bit)

### Kurulum

```bash
git clone https://github.com/furykingisback/scrivana.git
cd scrivana
npm install
```

### Geliştirme Modu

```bash
npm run dev
```

Bu komut Next.js (port 3000) ve Electron'u eşzamanlı başlatır. Kod değişiklikleri hot-reload ile otomatik yenilenir.

### Testler

```bash
npm run typecheck   # Tip kontrolü
npm test            # Birim testleri (Vitest)
npm run test:e2e    # Uçtan uca testler (Playwright + paketli uygulama)
```

### Paketleme

```bash
npm run dist:win    # Windows için NSIS + Portable
```

Paketlenmiş dosyalar `release/` klasörüne çıkar.

## Proje Yapısı

```
scrivana/
├── main/                    # Electron ana süreç (PDF işlemleri, dosya E/A)
│   ├── index.ts             # Pencere yönetimi, IPC
│   ├── pdfOps.ts            # Tüm PDF dönüşümleri (pdf-lib, pdfjs-dist, tesseract.js)
│   ├── pdfjsSetup.ts        # Canvas factory (canvas modülü gerektirmez)
│   ├── docx.ts              # Word (.docx) içe/dışa aktarma
│   └── ipc.ts               # IPC kanalı tanımları
├── src/                     # Renderer (React + Next.js)
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── StudioApp.tsx    # Ana uygulama (sekmeler, komut paleti)
│   │   ├── EditorPage.tsx   # Kelime işlemci editörü (Tiptap)
│   │   ├── PdfToolsPanel.tsx    # PDF araçları paneli
│   │   ├── PdfEditorPanel.tsx   # PDF sayfa düzenleme
│   │   ├── PdfThumbsPanel.tsx   # Sayfa küçük resimleri
│   │   └── StatusBar.tsx        # Durum çubuğu
│   └── styles/globals.css   # Stiller, tema değişkenleri
├── tests/
│   ├── docxTemplate.test.ts # Şablon testleri (6)
│   ├── pdfOps.test.ts       # PDF işlem testleri (62)
│   └── e2e/smoke.spec.ts    # E2E testleri (15)
├── assets/ocr/              # Tesseract OCR verileri (eng + tur)
├── scripts/                 # Yardımcı betikler
├── electron-builder.yml     # Paketleme yapılandırması
└── package.json
```

## Kod Stili

- TypeScript zorunlu — `any` kaçının
- Fonksiyonel React bileşenleri + hook'lar
- Tailwind CSS ile stil
- Hata yönetimi: `try/catch` + toast bildirimi
- Commit mesajları İngilizce ve açıklayıcı: `feat: add OCR support`, `fix: resolve scroll issue`

## Testler

- **Birim testleri** (Vitest): `tests/pdfOps.test.ts`, `tests/docxTemplate.test.ts`
- **E2E testleri** (Playwright): `tests/e2e/smoke.spec.ts` — uygulamayı başlatıp gerçek etkileşim test eder
- Yeni özellikler için test ekleme zorunlu

## Lisans

Katkıların MIT lisansı altında yayınlanacağını kabul etmiş olursun.

## Sorular?

[Issue aç](https://github.com/furykingisback/scrivana/issues) veya discussion'da sor.
