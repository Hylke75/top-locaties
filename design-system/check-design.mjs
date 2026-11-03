#!/usr/bin/env node
/**
 * Top Locaties — lichte, afhankelijkheidsvrije design-audit.
 *
 * Gebruik:
 *   node design-system/check-design.mjs src app components
 *   node design-system/check-design.mjs --strict src app
 *
 * De bestaande dist/ prototypebestanden worden bewust NIET standaard gescand:
 * deze bevatten historische tussenkleuren en inline styles. De check is een
 * waarschuwingssysteem voor NIEUWE UI en vervangt geen visuele review.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const folders = args.filter((arg) => arg !== '--strict');
const roots = folders.length ? folders : ['src', 'app', 'components'];
const extensions = new Set(['.css', '.scss', '.html', '.jsx', '.tsx', '.js', '.mjs', '.ts']);
const ignores = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'vendor', 'design-system']);
const tokens = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'tokens.json'), 'utf8'));
const canonicalHex = new Set(['#fff', '#000']);
Object.values(tokens.color).forEach((entry) => canonicalHex.add(entry.$value.toLowerCase()));
Object.values(tokens.emotions).forEach((value) => canonicalHex.add(value.toLowerCase()));
const issueList = [];
let fileCount = 0;

function report(file, line, code, text) {
  issueList.push(`${file}:${line} ${code} ${text}`);
}
function inspect(file) {
  fileCount += 1;
  const raw = fs.readFileSync(file, 'utf8');
  raw.split('\n').forEach((line, index) => {
    const n = index + 1;
    for (const hex of line.match(/#[\da-fA-F]{3,8}\b/g) || []) {
      if (!canonicalHex.has(hex.toLowerCase())) {
        report(file, n, 'COLOR', `Niet-canonieke kleur ${hex}; controleer tokens.css.`);
      }
    }
    if (/font-family\s*:\s*[^;\n]*(Poppins|Montserrat|Inter|Roboto)(?=[,;"'])/i.test(line)) {
      report(file, n, 'FONT', 'Andere fontfamilie dan Archivo Black / DM Mono / DM Sans.');
    }
    if (/\bborder-radius\s*:\s*(?:1[2-9]|[2-9]\d)px/i.test(line) || /\brounded-(?:xl|2xl|3xl|full)\b/i.test(line)) {
      report(file, n, 'SHAPE', 'Grote afgeronde hoeken; Top Locaties gebruikt hoekige kaarten.');
    }
    if (/\b(?:glassmorphism|backdrop-blur|bg-gradient-to|from-purple|to-indigo)\b/i.test(line)) {
      report(file, n, 'STYLE', 'Generiek AI/SaaS-stijlpatroon gevonden.');
    }
  });
}
function walk(entry) {
  if (!fs.existsSync(entry)) return;
  const stats = fs.lstatSync(entry);
  if (stats.isSymbolicLink()) return;
  if (stats.isDirectory()) {
    for (const item of fs.readdirSync(entry)) {
      if (!ignores.has(item)) walk(path.join(entry, item));
    }
  } else if (extensions.has(path.extname(entry))) {
    inspect(entry);
  }
}

roots.forEach(walk);
console.log(`TOP LOCATIES DESIGN AUDIT / ${fileCount} UI-bestanden gecontroleerd`);
if (!fileCount) console.log('Geen bronbestanden gevonden in de opgegeven mappen.');
if (!issueList.length) console.log('Geen automatische designafwijkingen gevonden.');
else {
  issueList.forEach((issue) => console.warn(`WAARSCHUWING ${issue}`));
  console.log(`Totaal: ${issueList.length} signalen. Controleer de context per geval.`);
}
console.log('Een geslaagde scan is GEEN vervanging voor screenshots, toegankelijkheid of gebruikers-QA.');
if (strict && issueList.length) process.exitCode = 1;
