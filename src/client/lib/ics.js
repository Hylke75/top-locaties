// Agenda-export (.ics, RFC 5545): het evenement zelf (met draaiboek) en de mijlpalen uit de aftelplanning.
// Werkt in Outlook, Google Agenda en Apple Agenda. Lokale tijd Europe/Amsterdam.
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n').replace(/\uFE0E/g, '');
const fold = (line) => { const out = []; let s = line; while (s.length > 74) { out.push(s.slice(0, 74)); s = ` ${s.slice(74)}`; } out.push(s); return out.join('\r\n'); };
const dateOnly = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const local = (ymd, hm) => `${ymd.replace(/-/g, '')}T${hm.replace(':', '')}00`;
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const TZ = ['BEGIN:VTIMEZONE', 'TZID:Europe/Amsterdam', 'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT', 'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD', 'END:VTIMEZONE'];

/**
 * @param {{title:string, date:string, start:string, end?:string, location?:string, description?:string, uid?:string,
 *          milestones?:{date:Date, title:string, description?:string}[]}} ev
 */
export function buildIcs(ev) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date || '')) throw new Error('Vul eerst een datum in.');
  const start = /^\d{1,2}:\d{2}$/.test(ev.start || '') ? ev.start.padStart(5, '0') : '09:00';
  let end = /^\d{1,2}:\d{2}$/.test(ev.end || '') ? ev.end.padStart(5, '0') : null;
  let endDate = ev.date;
  if (!end) { const [h, m] = start.split(':').map(Number); end = `${pad(Math.min(23, h + 4))}:${pad(m)}`; }
  if (end <= start) { const d = new Date(`${ev.date}T12:00:00`); d.setDate(d.getDate() + 1); endDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  const uid = ev.uid || `${Date.now()}@top-locaties.nl`;
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Top Locaties//Eventconcept//NL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...TZ,
    'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp()}`, `DTSTART;TZID=Europe/Amsterdam:${local(ev.date, start)}`, `DTEND;TZID=Europe/Amsterdam:${local(endDate, end)}`,
    `SUMMARY:${esc(ev.title)}`, ...(ev.location ? [`LOCATION:${esc(ev.location)}`] : []), ...(ev.description ? [`DESCRIPTION:${esc(ev.description)}`] : []), 'END:VEVENT'];
  (ev.milestones || []).forEach((m, i) => {
    if (!(m.date instanceof Date) || Number.isNaN(m.date.getTime())) return;
    const next = new Date(m.date); next.setDate(next.getDate() + 1);
    L.push('BEGIN:VEVENT', `UID:${i}-${uid}`, `DTSTAMP:${stamp()}`, `DTSTART;VALUE=DATE:${dateOnly(m.date)}`, `DTEND;VALUE=DATE:${dateOnly(next)}`,
      `SUMMARY:${esc(`${ev.title}: ${m.title}`)}`, ...(m.description ? [`DESCRIPTION:${esc(m.description)}`] : []), 'TRANSP:TRANSPARENT', 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return `${L.map(fold).join('\r\n')}\r\n`;
}
export const ICS_MIME = 'text/calendar;charset=utf-8';
