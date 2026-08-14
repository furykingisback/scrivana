const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const getCorePath = path.join(root, 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'getCore.js');

if (fs.existsSync(getCorePath)) {
  let content = fs.readFileSync(getCorePath, 'utf8');
  if (content.includes('const simdSupport = await simd();') || content.includes('const simdSupport = true;')) {
    content = content
      .replace('const simdSupport = await simd();', 'const simdSupport = false;')
      .replace('const relaxedSimdSupport = await relaxedSimd();', 'const relaxedSimdSupport = false;');
    fs.writeFileSync(getCorePath, content, 'utf8');
    console.log('[patch-tesseract] getCore.js başarıyla yamalandı (SIMD devre dışı).');
  } else {
    console.log('[patch-tesseract] getCore.js zaten yamalanmış veya farklı sürüm.');
  }
} else {
  console.log('[patch-tesseract] getCore.js bulunamadı, atlandı.');
}
