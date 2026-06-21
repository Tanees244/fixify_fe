import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const twPath = path.join(root, 'src/app/shared/ui/tw.ts');
const outPath = path.join(root, 'src/tw-safelist.html');

const source = fs.readFileSync(twPath, 'utf8');
const strings = [...source.matchAll(/'([^']+)'/g)].map((m) => m[1]);

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');

const lines = strings.map(
  (value, index) =>
    `  <span class="${escapeHtml(value)}" aria-hidden="true"></span>`,
);

const html = `<!doctype html>
<!-- Auto-generated from tw.ts — do not edit manually -->
<html lang="en">
<head><meta charset="utf-8" /><title>Tailwind safelist</title></head>
<body hidden>
${lines.join('\n')}
</body>
</html>
`;

fs.writeFileSync(outPath, html);
console.log(`Wrote ${outPath} (${strings.length} class strings)`);
