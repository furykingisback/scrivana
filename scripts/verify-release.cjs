const fs = require('fs');
const path = require('path');
const { listPackage } = require('@electron/asar');

const root = path.resolve(__dirname, '..');
const unpackedDir = path.join(root, 'release', 'win-unpacked');
const asarPath = path.join(unpackedDir, 'resources', 'app.asar');

const REQUIRED = [
  'out/index.html',
  'dist-electron/main/index.js',
  'dist-electron/main/pdfOps.js',
  'dist-electron/main/pdfWorker.js',
  'dist-electron/preload/index.js',
  'node_modules/tslib/tslib.js',
  'node_modules/pdf-lib-with-encrypt/cjs/index.js',
  'node_modules/pako/dist/pako.js',
  'node_modules/pdfjs-dist/legacy/build/pdf.js',
  'node_modules/docx/dist/index.cjs',
  'node_modules/tesseract.js/src/index.js',
  'node_modules/tesseract.js-core/index.js',
];

function fail(msg) {
  console.error(`[verify-release] FAIL: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(asarPath)) fail(`app.asar bulunamadı: ${asarPath} (önce electron-builder çalıştırın)`);

const entries = new Set();
const walk = (node, prefix = '') => {
  if (!node || typeof node !== 'object') return;
  for (const [name, child] of Object.entries(node)) {
    const p = prefix ? `${prefix}/${name}` : name;
    if (child && typeof child === 'object' && 'files' in child) {
      walk(child.files, p);
    } else if (child && typeof child === 'object' && 'file' in child) {
      entries.add(`${prefix}/${child.file}`);
    }
  }
};

try {
  const tree = listPackage(asarPath);
  if (Array.isArray(tree)) {
    for (const item of tree) {
      if (typeof item === 'string') {
        entries.add(`app/${item.replace(/\\/g, '/').replace(/^\/+/, '')}`);
      } else if (item && typeof item === 'object' && item.file) {
        entries.add(`app/${item.file}`);
      }
    }
  } else {
    walk(tree.files, 'app');
  }
} catch (err) {
  fail(`asar listelenemedi: ${err.message}`);
}

const missing = REQUIRED.filter((r) => !entries.has(`app/${r}`));
if (missing.length) {
  fail(`zorunlu modüller eksik:\n  ${missing.join('\n  ')}`);
}

const expectedArtifacts = [
  'Scrivana PDF & Word Studio-Setup-1.0.0-x64.exe',
  'Scrivana PDF & Word Studio-Portable-1.0.0-x64.exe',
];
const missingArtifacts = expectedArtifacts.filter((a) => !fs.existsSync(path.join(root, 'release', a)));
if (missingArtifacts.length) {
  fail(`kurulum çıktıları eksik:\n  ${missingArtifacts.join('\n  ')}`);
}

console.log(`[verify-release] OK — asar ve kurulum çıktıları doğrulandı (${entries.size} dosya).`);
