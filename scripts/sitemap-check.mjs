#!/usr/bin/env node
// Controle: alle sitemap-URL's geven status 200 en tonen nergens invulplekken als "[DATUM]".
// Gebruik: node scripts/sitemap-check.mjs [basis-URL]  (standaard http://localhost:4173)
import fs from 'node:fs';
import { PLACEHOLDER_RE } from '../src/lib/placeholders.mjs';

const base = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '');
const urls = [...fs.readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>https:\/\/top-locaties\.nl([^<]*)<\/loc>/g)].map((m) => m[1]);
// Het conceptplan-document is de invulweergave: daar zijn invulvelden juist de bedoeling.
const fillView = (u) => /\/conceptplan\/$/.test(u) && u.startsWith('/eventconcepten/');
const visible = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<template[\s\S]*?<\/template>|<textarea[\s\S]*?<\/textarea>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const bad = [];
for (let i = 0; i < urls.length; i += 8) {
  await Promise.all(urls.slice(i, i + 8).map(async (u) => {
    const r = await fetch(base + u);
    if (r.status !== 200) { bad.push(`${r.status} ${u}`); return; }
    const m = visible(await r.text()).match(PLACEHOLDER_RE);
    if (m && !fillView(u)) bad.push(`placeholder "${m[0]}" op ${u}`);
  }));
}
console.log(`${urls.length} sitemap-URL's gecontroleerd tegen ${base}`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('Alles 200, geen zichtbare invulplekken.');
