import { html, raw } from '../lib/html.mjs';
import { SITE } from '../lib/data.mjs';

/**
 * @param {{title:string, description:string, path:string, body:any, scripts?:string[], data?:any, preload?:string, noindex?:boolean}} o
 */
export function layout({ title, description, path, body, scripts = [], styles = [], data = null, preload = null, noindex = false }) {
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
<meta name="theme-color" content="#292a2c">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap">
${preload ? html`<link rel="preload" as="image" href="${preload}">` : ''}
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/components.css">
${styles.map((st) => html`<link rel="stylesheet" href="/assets/css/${st}">`)}
</head>
<body class="tl-app" id="top">
<a class="tl-skip" href="#main">Ga naar de inhoud</a>
${body}
${data ? html`<script type="application/json" id="tl-data">${raw(JSON.stringify(data).replace(/</g, '\\u003c'))}</script>` : ''}
<script type="module" src="/assets/js/nav.js"></script>
${scripts.map((s) => html`<script type="module" src="/assets/js/${s}"></script>`)}
</body>
</html>`}`;
}
