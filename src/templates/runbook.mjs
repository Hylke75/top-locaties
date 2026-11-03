// Draaiboek, catering, entertainment, praktisch en uitnodiging — de "complete concept"-secties.
// De bezoeker maakt dit met de vragenlijst op maat (src/client/lib/tailor.js).
import { html, pad, raw } from '../lib/html.mjs';
import { overline } from './components.mjs';

const list = (items) => html`<ul class="tl-list">${items.map((x) => html`<li>${x}</li>`)}</ul>`;

export function runbookTable(rows) {
  return html`<div class="tl-runbook" role="table" aria-label="Dagdraaiboek">
  <div class="tl-runbook__row tl-runbook__row--head" role="row"><span role="columnheader">TIJD</span><span role="columnheader">DUUR</span><span role="columnheader">ONDERDEEL</span><span role="columnheader">WIE</span><span role="columnheader">WAAR</span></div>
  ${rows.map((r) => html`<div class="tl-runbook__row" role="row">
    <span class="tl-runbook__time" role="cell">${r.time}</span>
    <span class="tl-runbook__duration" role="cell" data-label="DUUR">${r.duration}</span>
    <span role="cell"><strong class="tl-runbook__title">${r.title}</strong><span class="tl-runbook__desc">${r.description}</span>${r.needs?.length ? html`<span class="tl-runbook__needs">NODIG: ${r.needs.join(' · ')}</span>` : ''}</span>
    <span class="tl-runbook__meta" role="cell" data-label="WIE">${r.owner}</span>
    <span class="tl-runbook__meta" role="cell" data-label="WAAR">${r.space}</span>
  </div>`)}
</div>`;
}

export function planningList(phases) {
  return html`<div class="tl-timeline">${phases.map((p) => html`<div class="tl-timeline__item tl-timeline__item--wide"><span class="tl-timeline__time">${p.when}</span><div><h3 class="tl-timeline__title">${p.title}</h3>${list(p.tasks)}</div></div>`)}</div>`;
}

export function completeSections(concept, startNumber = 3) {
  let n = startNumber;
  const num = () => pad(n++);
  const c = concept;
  return html`
<section class="tl-section" id="draaiboek" aria-labelledby="runTitle">
  ${overline(`${num()} / HET COMPLETE DRAAIBOEK`, (c.duration || 'MINUUT TOT MINUUT').toUpperCase())}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="runTitle">VAN MINUUT<br>TOT <span class="tl-accent">MINUUT.</span></h2>
    <p>Het volledige dagdraaiboek: wat er gebeurt, hoe lang, wie verantwoordelijk is en waar. Maak het onderaan deze pagina op maat met jouw datum, starttijd en groep.</p>
  </div>
  ${runbookTable(c.runbook || [])}
  <h3 class="tl-display tl-display--sm tl-section-head tl-body--gap">DE AFTELPLANNING.</h3>
  ${planningList(c.planning || [])}
</section>

<section class="tl-section tl-section--taupe" id="catering" aria-labelledby="cateringTitle">
  ${overline(`${num()} / CATERINGVOORSTEL & ENTERTAINMENT`, 'EEN COMPLEET VOORSTEL OM MEE TE BEGINNEN')}
  <div class="tl-columns">
    <p class="tl-intro-label">${c.catering?.concept || ''}</p>
    <div>
      <h2 class="tl-display tl-display--md" id="cateringTitle">ETEN ALS<br><span class="tl-accent">ONDERDEEL VAN HET VERHAAL.</span></h2>
      <div class="tl-menu">${(c.catering?.moments || []).map((m) => html`<div class="tl-menu__item">
        <span class="tl-menu__when">${m.time} / ${m.moment}</span>
        <p class="tl-menu__dish">${m.proposal}</p>
        <span class="tl-menu__meta">${m.format}${m.dietary && m.dietary !== '—' ? html` · ${m.dietary}` : ''}</span>
      </div>`)}</div>
      <dl class="tl-facts"><div><dt>DRANKEN</dt><dd>${c.catering?.drinks || ''}</dd></div><div><dt>VOOR DE CATERAAR</dt><dd>${c.catering?.notes || ''}</dd></div><div><dt>STATUS</dt><dd>Voorstel ter inspiratie; de cateraar maakt het definitieve menu en de offerte.</dd></div></dl>
    </div>
  </div>
  <h3 class="tl-display tl-display--sm tl-section-head tl-body--gap">ENTERTAINMENT.</h3>
  <div class="tl-runbook tl-runbook--four" role="table" aria-label="Entertainmentprogramma">
    <div class="tl-runbook__row tl-runbook__row--head" role="row"><span role="columnheader">MOMENT</span><span role="columnheader">VORM</span><span role="columnheader">WAT EN WAAROM</span><span role="columnheader">ROL</span></div>
    ${(c.entertainment || []).map((e) => html`<div class="tl-runbook__row" role="row"><span class="tl-runbook__time" role="cell">${e.moment}</span><span class="tl-runbook__duration" role="cell">${e.format}</span><span role="cell"><strong class="tl-runbook__title">${e.option}</strong><span class="tl-runbook__desc">${e.why}</span></span><span class="tl-runbook__meta" role="cell">${e.role}</span></div>`)}
  </div>
</section>

<section class="tl-section" id="praktisch" aria-labelledby="practTitle">
  ${overline(`${num()} / ALLES PRAKTISCH`, 'BEZETTING / RUIMTES / CHECKLIST / PLAN B')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="practTitle">NIETS<br><span class="tl-accent">VERGETEN.</span></h2>
    <p>Wie je nodig hebt, welke ruimtes, wat je moet regelen, hoe je het groter of kleiner maakt en wat je doet als iets misgaat.</p>
  </div>
  <div class="tl-columns tl-columns--equal">
    <div>
      <h3 class="tl-mono tl-subhead">01 / BEZETTING</h3>
      <dl class="tl-facts tl-facts--stack">${(c.crew || []).map((x) => html`<div><dt>${x.role} — ${x.count}</dt><dd>${x.task}</dd></div>`)}</dl>
    </div>
    <div>
      <h3 class="tl-mono tl-subhead">02 / RUIMTES</h3>
      <dl class="tl-facts tl-facts--stack">${(c.spaces || []).map((x) => html`<div><dt>${x.space}</dt><dd>${x.use}. ${x.requirements}.</dd></div>`)}</dl>
    </div>
  </div>
  <h3 class="tl-mono tl-subhead tl-body--gap">03 / CHECKLIST</h3>
  <div class="tl-checklist">${(c.checklist || []).map((g) => html`<div class="tl-checklist__group"><strong class="tl-checklist__title">${g.group}</strong>${list(g.items)}</div>`)}</div>
  <div class="tl-columns tl-columns--equal tl-body--gap">
    <div>
      <h3 class="tl-mono tl-subhead">04 / VARIANTEN</h3>
      <dl class="tl-facts tl-facts--stack">${(c.variations || []).map((x) => html`<div><dt>${x.title}</dt><dd>${x.text}</dd></div>`)}</dl>
    </div>
    <div>
      <h3 class="tl-mono tl-subhead">05 / RISICO’S &amp; PLAN B</h3>
      <dl class="tl-facts tl-facts--stack">${(c.risks || []).map((x) => html`<div><dt>${x.risk}</dt><dd>${x.mitigation}</dd></div>`)}</dl>
    </div>
  </div>
  <div class="tl-values">
    <div><strong>06 / KOSTENPOSTEN</strong>${list(c.budgetItems || [])}<p>Bedragen vraag je op bij locatie en leveranciers; Top Locaties noemt geen prijzen.</p></div>
    <div><strong>07 / DUURZAAM</strong>${list(c.sustainability || [])}</div>
    <div><strong>08 / EVALUATIE</strong>${list(c.evaluation || [])}</div>
  </div>
</section>

<section class="tl-section tl-section--mist" id="uitnodiging" aria-labelledby="invTitle">
  ${overline(`${num()} / DE UITNODIGING`, 'KANT-EN-KLARE TEKST')}
  <div class="tl-columns">
    <p class="tl-intro-label">Vul de vragenlijst onderaan in en de tekst wordt automatisch aangevuld met jouw datum en locatie.</p>
    <div>
      <h2 class="tl-display tl-display--md" id="invTitle">${c.invitation?.subject || ''}</h2>
      <p class="tl-body tl-body--gap">${c.invitation?.text || ''}</p>
      <p class="tl-note"><strong>HERINNERING:</strong> ${c.invitation?.reminder || ''}</p>
    </div>
  </div>
</section>`;
}

export function questionnaire(concept) {
  const c = concept;
  return html`<form class="tl-questionnaire" data-tailor-form aria-labelledby="tailorTitle">
  <h3 class="tl-display tl-display--sm" id="tailorTitle">OP MAAT: VERTEL ONS<br><span class="tl-accent">JE EVENEMENT.</span></h3>
  <p class="tl-mono tl-on-dark-note">Beantwoord de vragen en we vullen het draaiboek, de planning, catering, bezetting en uitnodiging voor je in. Alles blijft in deze browser.</p>
  <div class="tl-questionnaire__grid">
    <label class="tl-field"><span>01 / ORGANISATIE</span><input name="organisatie" autocomplete="organization" placeholder="Naam van je organisatie"></label>
    <label class="tl-field"><span>02 / DATUM</span><input name="datum" type="date"></label>
    <label class="tl-field"><span>03 / STARTTIJD</span><input name="start" type="time" value="${(c.runbook || []).find((r) => !/crew|opbouw|briefing|inrichten|generale/i.test(r.title))?.time || '09:00'}"></label>
    <label class="tl-field"><span>04 / AANTAL GASTEN</span><input name="gasten" type="number" min="5" max="5000" inputmode="numeric" placeholder="${c.guestCountMin}–${c.guestCountMax}"></label>
    <label class="tl-field tl-questionnaire__wide"><span>05 / WAT MOET HET OPLEVEREN?</span><input name="doel" placeholder="${c.objective}"></label>
    <label class="tl-field"><span>06 / DOELGROEP</span><input name="doelgroep" placeholder="${(c.audiences || [])[0] || ''}"></label>
    <label class="tl-field"><span>07 / CONTACTPERSOON</span><input name="contact" autocomplete="name" placeholder="Naam"></label>
    <fieldset class="tl-field tl-questionnaire__wide"><legend>08 / DIEETWENSEN IN DE GROEP</legend><div class="tl-chip-set">
      ${['vegetarisch', 'vegan', 'glutenvrij', 'lactosevrij', 'halal', 'notenallergie'].map((d) => html`<label class="tl-check tl-check--on-dark"><input type="checkbox" name="dieet" value="${d}"> ${d}</label>`)}
    </div></fieldset>
    <fieldset class="tl-field"><legend>09 / FORMAT</legend><label class="tl-check tl-check--on-dark"><input type="checkbox" name="hybride" value="ja"> Ook online deelnemers (hybride)</label></fieldset>
    <fieldset class="tl-field"><legend>10 / TOEGANKELIJKHEID</legend><label class="tl-check tl-check--on-dark"><input type="checkbox" name="toegankelijk" value="ja"> Rolstoeltoegankelijk nodig</label></fieldset>
    <label class="tl-field"><span>11 / DUURZAAMHEID</span><select name="duurzaam"><option value="basis">Basis</option><option value="hoog">Zo duurzaam mogelijk</option></select></label>
    <label class="tl-field"><span>12 / EIGEN BUDGETINDICATIE (OPTIONEEL)</span><input name="budget" placeholder="Bijv. € 15.000 totaal"></label>
  </div>
  <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-tailor-status></span><button class="tl-button tl-button--accent" type="submit">MAAK MIJN DRAAIBOEK OP MAAT ↓</button></div>
</form>
<div class="tl-tailored" data-tailor-output hidden tabindex="-1" aria-live="polite"></div>`;
}

const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

/** Programma met per onderdeel een dialoog (native <dialog>) met alle details. */
export function programTimeline(concept) {
  const prog = concept.program || [];
  const rb = concept.runbook || [];
  return html`<div class="tl-timeline">${prog.map((it, i) => {
    const id = `prog-${concept.slug}-${i + 1}`;
    const from = toMin(it.time);
    const to = i + 1 < prog.length ? toMin(prog[i + 1].time) : Infinity;
    const rows = rb.filter((r) => { const m = toMin(r.time); return m != null && m >= from && m < to; });
    const d = it.details || {};
    return html`<div class="tl-timeline__item"><span class="tl-timeline__time">${it.time}</span><div>
      <h3 class="tl-timeline__title"><button class="tl-timeline__open" type="button" data-open-dialog="${id}" aria-haspopup="dialog">${it.title} <span aria-hidden="true">↗</span></button></h3>
      <p class="tl-timeline__body">${it.description}</p>
      <button class="tl-text-button" type="button" data-open-dialog="${id}" aria-haspopup="dialog">MEER OVER DIT ONDERDEEL ↗</button>
    </div></div>
    <dialog class="tl-dialog" id="${id}" aria-labelledby="${id}-t">
      <div class="tl-dialog__head"><span class="tl-mono">${pad(i + 1)} / ${it.time} / ${concept.title.toUpperCase()}</span><button class="tl-dialog__close" type="button" data-close-dialog aria-label="Sluiten">SLUITEN ×</button></div>
      <h2 class="tl-display tl-display--md" id="${id}-t">${it.title}</h2>
      <p class="tl-lead">${d.intro || it.description}</p>
      ${d.steps?.length ? html`<h3 class="tl-mono tl-subhead tl-body--gap">ZO PAK JE HET AAN</h3><ol class="tl-steplist">${d.steps.map((x) => html`<li>${x}</li>`)}</ol>` : ''}
      <div class="tl-columns tl-columns--equal tl-body--gap">
        ${d.roles?.length ? html`<div><h3 class="tl-mono tl-subhead">WIE</h3><div class="tl-chip-set">${d.roles.map((r) => html`<span class="tl-chip">${r}</span>`)}</div></div>` : ''}
        ${d.needs?.length ? html`<div><h3 class="tl-mono tl-subhead">WAT JE NODIG HEBT</h3><ul class="tl-list">${d.needs.map((x) => html`<li>${x}</li>`)}</ul></div>` : ''}
      </div>
      ${rows.length ? html`<h3 class="tl-mono tl-subhead tl-body--gap">IN HET DRAAIBOEK</h3>${runbookTable(rows)}` : ''}
      ${d.tip ? html`<p class="tl-dialog__tip"><strong>TIP</strong> ${d.tip}</p>` : ''}
    </dialog>`;
  })}</div>`;
}

/** Keuzes direct in de composer: gevoel, locatie (alle partners) en makers (alle partners). */
export function composerChoices(concept, data) {
  const recommended = concept.venueMatches.map((m) => data.venueById[m.venueId]).filter(Boolean);
  const recIds = new Set(recommended.map((v) => v.id));
  const others = data.venues.filter((v) => !recIds.has(v.id)).sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  const opt = (v) => html`<option value="${v.id}">${v.name} — ${v.city} (${v.capacityMax ? `tot ${v.capacityMax}` : 'capaciteit onbekend'})</option>`;
  const recSup = concept.supplierMatches.map((m) => ({ s: data.supplierById[m.supplierId], role: m.role })).filter((x) => x.s);
  const recSupIds = new Set(recSup.map((x) => x.s.id));
  const otherSup = data.suppliers.filter((s) => !recSupIds.has(s.id));
  const supBox = (s, role) => html`<label class="tl-check tl-check--on-dark"><input type="checkbox" data-composer-supplier="${s.id}"> ${s.name} <span class="tl-note tl-on-dark-note">/ ${role}</span></label>`;
  return html`<div class="tl-composer__grid tl-composer__grid--three">
  <div class="tl-composer__column">
    <span class="tl-mono">01 / GEWENST GEVOEL</span>
    <div class="tl-chip-set tl-composer__choices" role="group" aria-label="Kies maximaal twee gevoelens">${data.feelings.map((f) => html`<button class="tl-chip-button tl-chip-button--on-dark" type="button" data-composer-feel="${f.id}" aria-pressed="false">${f.label.toUpperCase()}</button>`)}</div>
    <div class="tl-composer__result" data-plan-feelings></div>
  </div>
  <div class="tl-composer__column">
    <label class="tl-mono" for="composerVenue">02 / KIES DE LOCATIE</label>
    <select class="tl-composer__select" id="composerVenue" data-composer-venue>
      <option value="">Nog geen locatie gekozen</option>
      <optgroup label="Aanbevolen bij dit concept">${recommended.map(opt)}</optgroup>
      <optgroup label="Alle aangesloten partnerlocaties">${others.map(opt)}</optgroup>
    </select>
    <div class="tl-composer__result" data-plan-venue>Nog geen locatie gekozen.</div>
    <p class="tl-note tl-on-dark-note" data-plan-venue-fit></p>
  </div>
  <div class="tl-composer__column">
    <span class="tl-mono">03 / KIES JE MAKERS</span>
    <div class="tl-composer__choices tl-composer__checks" role="group" aria-label="Aanbevolen makers">${recSup.map(({ s, role }) => supBox(s, role))}</div>
    <details class="tl-composer__more"><summary class="tl-text-button">ANDERE LEVERANCIERSPARTNERS (${otherSup.length}) ↓</summary><div class="tl-composer__checks">${otherSup.map((s) => supBox(s, s.category))}</div></details>
    <div class="tl-composer__result" data-plan-suppliers>Nog geen makers gekozen.</div>
  </div>
</div>`;
}

/** Teaser op elke conceptpagina: wat een eventbureau doet en waar je het hier vindt. */
export function playbookSection(playbook, number) {
  return html`<section class="tl-section tl-section--dark" id="zelf-regelen" aria-labelledby="selfTitle">
  ${overline(`${number} / GEEN EVENTBUREAU NODIG`, 'ALLES WAT EEN BUREAU DOET, OP DEZE PAGINA')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="selfTitle">ZO REGEL JE<br><span class="tl-accent">HET ZELF.</span></h2>
    <p>${playbook.intro}</p>
  </div>
  <dl class="tl-facts tl-facts--on-dark tl-facts--two">${playbook.agencyVsYou.map(([task, here]) => html`<div><dt>${task}</dt><dd>${here}</dd></div>`)}</dl>
  <div class="tl-callout"><span>Negen stappen van briefing tot evaluatie, met de vragen voor elke offerte en een checklist voor vergunningen, veiligheid en privacy.</span><a href="/zelf-organiseren/">LEES DE COMPLETE GIDS ↗</a></div>
</section>`;
}
