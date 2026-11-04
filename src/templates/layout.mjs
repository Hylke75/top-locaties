import { html, raw } from '../lib/html.mjs';
import { SITE } from '../lib/data.mjs';
import { readFileSync } from 'node:fs';
const ACC = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).accounts || {};

/**
 * @param {{title:string, description:string, path:string, body:any, scripts?:string[], data?:any, preload?:string, noindex?:boolean}} o
 */
export function layout({ title, description, path, body, scripts = [], styles = [], data = null, preload = null, noindex = false, jsonld = null, crumbs = null, ogImage = null }) {
  const canonical = SITE.origin + path;
  return `<!doctype html>
${html`<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
${noindex ? raw('<meta name="robots" content="noindex">') : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="Top Locaties">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${/^https?:/.test(ogImage || '') ? ogImage : SITE.origin + (ogImage || '/assets/og/default.jpg')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#292a2c">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/archivo-black-latin-45f5d4.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-sans-latin-002a94.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
${preload ? html`<link rel="preload" as="image" href="${preload}">` : ''}
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/components.css">
${(() => {
  // Gestructureerde data (schema.org): broodkruimel + paginaspecifiek. Alleen feiten uit bron of redactie.
  const graph = [...(Array.isArray(jsonld) ? jsonld : jsonld ? [jsonld] : [])];
  if (crumbs?.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE.origin + c.path })) });
  return graph.length ? raw(`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`) : '';
})()}
${styles.map((st) => html`<link rel="stylesheet" href="/assets/css/${st}">`)}
</head>
<body class="tl-app" id="top" data-sb-url="${ACC.url || ''}" data-sb-key="${ACC.publishableKey || ''}">
<a class="tl-skip" href="#main">Ga naar de inhoud</a>
${body}
${data ? html`<script type="application/json" id="tl-data">${raw(JSON.stringify(data).replace(/</g, '\\u003c'))}</script>` : ''}
<script type="module" src="/assets/js/nav.js"></script>
<script>/* Vercel Web Analytics: cookieloos, geen persoonsgegevens; alleen op het productiedomein. */
if (/(^|\.)top-locaties\.nl$/.test(location.hostname) && !navigator.doNotTrack?.startsWith('1')) { window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); }; const s = document.createElement('script'); s.defer = true; s.src = '/_vercel/insights/script.js'; document.head.append(s); }</script>
${scripts.map((s) => html`<script type="module" src="/assets/js/${s}"></script>`)}
</body>
</html>`}`;
}
