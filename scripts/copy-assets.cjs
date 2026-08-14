const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// 1. Fonts
const srcFonts = path.join(root, 'assets', 'fonts');
const outFonts = path.join(root, 'dist-electron', 'main', 'assets', 'fonts');
if (fs.existsSync(srcFonts)) {
  fs.mkdirSync(outFonts, { recursive: true });
  for (const f of fs.readdirSync(srcFonts)) {
    fs.copyFileSync(path.join(srcFonts, f), path.join(outFonts, f));
  }
  console.log(`copy-assets (fonts): ${fs.readdirSync(outFonts).join(', ')}`);
} else {
  console.log('copy-assets: assets/fonts yok.');
}

// 2. OCR traineddata
const srcOcr = path.join(root, 'assets', 'ocr');
const outOcr = path.join(root, 'dist-electron', 'main', 'assets', 'ocr');
if (fs.existsSync(srcOcr)) {
  fs.mkdirSync(outOcr, { recursive: true });
  for (const f of fs.readdirSync(srcOcr)) {
    fs.copyFileSync(path.join(srcOcr, f), path.join(outOcr, f));
  }
  console.log(`copy-assets (ocr): ${fs.readdirSync(outOcr).join(', ')}`);
} else {
  console.log('copy-assets: assets/ocr yok.');
}

