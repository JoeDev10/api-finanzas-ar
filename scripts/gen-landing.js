const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'public/index.html'), 'utf-8');
const escaped = html
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');
const ts = '// Auto-generated from public/index.html — do not edit directly\nexport const landingHtml: string = `' + escaped + '`;\n';
writeFileSync(join(root, 'src/landing.ts'), ts);
console.log('Generated src/landing.ts (' + ts.length + ' chars)');
