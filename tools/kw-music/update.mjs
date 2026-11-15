// Key West live music updater.
// Runs on GitHub Actions every 4 hours (see .github/workflows/kw-music.yml).
// Pulls venue schedules, scores each set for the Cooney crew, and writes data/kw-music.json,
// which key_west.html reads. No dependencies: plain Node 20.
//
// Safety rules:
//  - A source that fails keeps its previous events (never wipes good data on a bad fetch).
//  - Only Key West events are kept.
//  - Past days are dropped; everything from "today in Key West" forward is kept.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT_FILE = 'data/kw-music.json';
const UA = 'Mozilla/5.0 (compatible; CooneyVacationPortal/1.0; +https://vacation.cooneysparadise.com/)';
const TZ = 'America/New_York';

// ---------- Who and where we care about ----------
// Favorites get the top score. "Chase" names are well-loved locals worth building a night around.
const FAVORITES = [
  { name: 'Joe the Show', match: /joe\s*the\s*show/i },
  { name: 'Raven', match: /\braven\b/i },
];
const CHASE = [
  { name: 'Scott Kirby', match: /scott\s*kirby/i },
  { name: 'Caffeine Carl', match: /caffeine\s*carl/i },
  { name: 'Drew Bear', match: /drew\s*bear|andrew\s*gordon/i },
];
// Venue weights: Brian's top venue first, then the ones already in the app.
const VENUES = [
  { match: /green\s*parrot/i, weight: 40, why: "Green Parrot: your top venue" },
  { match: /smokin'?\s*tuna/i, weight: 35, why: "Smokin' Tuna: you're overdue" },
  { match: /schooner/i, weight: 35, why: "Schooner Wharf: Raven's home stage" },
  { match: /rick'?s/i, weight: 20, why: "Rick's: Joe the Show's home turf" },
  { match: /irish\s*kevin/i, weight: 20, why: "Irish Kevin's: a regular stop" },
  { match: /hog'?s\s*breath/i, weight: 15, why: "Hog's Breath: two blocks from the Galleon" },
  { match: /hank'?s/i, weight: 15, why: "Hank's: Garbo's is in the yard" },
  { match: /willie\s*t/i, weight: 15, why: "Willie T's: a regular stop" },
  { match: /sloppy\s*joe/i, weight: 10, why: "Sloppy Joe's: always something on" },
  { match: /blue\s*heaven/i, weight: 10, why: "Blue Heaven: courtyard music" },
  { match: /boat\s*house/i, weight: 10, why: "Boat House: a regular lunch stop" },
];
const NOT_A_BAND = /karaoke|bingo|trivia|\bdj\b|comedy|tea dance|\btba\b|\btbd\b|closed|private event|drag/i;

// ---------- Sources ----------
const SOURCES = [
  { id: 'keywesttourist', name: 'KeyWestTourist live music (about 30 venues)', url: 'https://www.keywesttourist.com/live-music/', kind: 'aggregator' },
  { id: 'joetheshow', name: 'Joe the Show calendar', url: 'https://joetheshow.com/wp-json/tribe/events/v1/events', kind: 'tribe', performer: 'Joe the Show' },
  { id: 'irishkevins', name: "Irish Kevin's calendar", url: 'https://irishkevins.com/wp-json/tribe/events/v1/events', kind: 'tribe', defaultVenue: "Irish Kevin's", defaultAddress: '211 Duval St' },
  { id: 'scottkirby', name: 'Scott Kirby calendar', url: 'https://www.scottkirby.com/wp-json/tribe/events/v1/events', kind: 'tribe', performer: 'Scott Kirby' },
];

// ---------- Helpers ----------
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = n => String(n).padStart(2, '0');

function decode(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').trim();
}

// "today" in Key West as YYYY-MM-DD
function keyWestToday() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return p; // en-CA formats as YYYY-MM-DD
}

function to24(label) {
  const m = String(label).match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'P') h += 12;
  return `${pad(h)}:${m[2]}`;
}
function label12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`;
}

async function getText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const t = await r.text();
  if (/please wait while your request is being verified/i.test(t)) throw new Error('blocked by a bot check');
  return t;
}

// ---------- Parsers ----------
function parseAggregator(html) {
  const out = [];
  const articles = html.match(/<article class="venue">[\s\S]*?<\/article>/g) || [];
  for (const a of articles) {
    const venue = decode((a.match(/venue__name">([^<]+)/) || [])[1]);
    const dateTxt = decode((a.match(/venue__date">([^<]+)/) || [])[1]);
    const dm = dateTxt.match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/);
    if (!venue || !dm) continue;
    const date = `${dm[3]}-${pad(MONTHS[dm[1].toLowerCase()])}-${pad(dm[2])}`;
    const sets = [...a.matchAll(/setrow__time">([^<]*)<\/span>\s*<span class="setrow__act">([^<]*)<\/span>/g)];
    for (const [, t, act] of sets) {
      const time = to24(t);
      if (!time) continue;
      out.push({ date, time, act: decode(act), venue });
    }
  }
  if (!out.length) throw new Error('page loaded but no venue sets were found (layout may have changed)');
  return out;
}

async function fetchTribe(src, today) {
  const out = [];
  out.raw = 0; out.droppedNotKW = [];
  const end = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
  let url = `${src.url}?per_page=50&start_date=${today}&end_date=${end}`;
  for (let page = 0; page < 6 && url; page++) {
    const data = JSON.parse(await getText(url));
    for (const e of data.events || []) {
      out.raw++;
      const v = (e.venue && !Array.isArray(e.venue)) ? e.venue : {};
      const venue = decode(v.venue) || src.defaultVenue || '';
      const city = decode(v.city);
      const address = decode(v.address) || src.defaultAddress || '';
      // Key West only. A venue with no city is kept only if it's a known Key West bar.
      const isKW = /key\s*west/i.test(city) || (!city && (src.defaultVenue || VENUES.some(x => x.match.test(venue))));
      if (!isKW) { if (out.droppedNotKW.length < 5) out.droppedNotKW.push(`${venue || '?'} / ${city || '?'}`); continue; }
      const [d, t] = String(e.start_date || '').split(' ');
      if (!d || !t) continue;
      const title = decode(e.title).replace(/\s*[\u2013\u2014-]\s*Key West,?\s*(FL|Florida)\s*$/i, '');
      out.push({
        date: d, time: e.all_day ? '12:00' : t.slice(0, 5),
        act: src.performer && !new RegExp(src.performer.split(' ')[0], 'i').test(title) ? `${src.performer}: ${title}` : title,
        venue: venue || 'Venue TBA', address,
      });
    }
    url = data.next_rest_url || null;
  }
  return out;
}

// ---------- Scoring ----------
function score(ev) {
  let s = 0; const why = []; const tags = [];
  const fav = FAVORITES.find(f => f.match.test(ev.act));
  const chase = CHASE.find(f => f.match.test(ev.act));
  const venue = VENUES.find(v => v.match.test(ev.venue));
  if (fav) { s += 100; why.push(`Favorite: ${fav.name}`); tags.push('favorite'); }
  if (chase) { s += 50; why.push(`One to chase: ${chase.name}`); tags.push('chase'); }
  if (venue) { s += venue.weight; why.push(venue.why); }
  const h = Number(ev.time.slice(0, 2));
  if (h >= 13 && h <= 22) s += 5; // fits the noon-to-late day
  if (NOT_A_BAND.test(ev.act)) { s -= 80; tags.push('not-a-band'); }
  return { score: s, why, tags };
}

function key(ev) {
  const v = ev.venue.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
  return `${ev.date}|${ev.time}|${v}`;
}

// ---------- Main ----------
const today = keyWestToday();
let previous = { events: [] };
try { previous = JSON.parse(await readFile(OUT_FILE, 'utf8')); } catch { /* first run */ }

const report = [];
const bySource = {};
for (const src of SOURCES) {
  const rec = { id: src.id, name: src.name, url: src.url.replace(/\/wp-json.*$/, '/'), ok: false, count: 0 };
  try {
    const evs = src.kind === 'aggregator' ? parseAggregator(await getText(src.url)) : await fetchTribe(src, today);
    bySource[src.id] = evs.map(e => ({ ...e, source: src.id }));
    rec.ok = true; rec.count = evs.length;
    if (evs.raw !== undefined) { rec.raw = evs.raw; if (evs.droppedNotKW.length) rec.droppedNotKW = evs.droppedNotKW; }
  } catch (e) {
    rec.error = String(e.message || e);
    // Keep this source's previous future events so one bad fetch doesn't blank the page.
    bySource[src.id] = (previous.events || []).filter(e => e.source === src.id && e.date >= today);
    rec.count = bySource[src.id].length; rec.keptPrevious = true;
  }
  report.push(rec);
  console.log(`${rec.ok ? 'OK  ' : 'FAIL'} ${src.id}: ${rec.count} sets${rec.raw !== undefined ? ` (feed had ${rec.raw}; not Key West: ${(rec.droppedNotKW || []).join(' | ')})` : ''} ${rec.error ? '(' + rec.error + ')' : ''}`);
}

// Merge: direct venue/artist feeds win over the aggregator for the same venue + date + time.
const merged = new Map();
for (const id of ['keywesttourist', 'irishkevins', 'joetheshow', 'scottkirby']) {
  for (const ev of bySource[id] || []) {
    if (ev.date < today) continue;
    merged.set(key(ev), ev);
  }
}
const events = [...merged.values()]
  .map(ev => { const sc = score(ev); return { ...ev, timeLabel: label12(ev.time), ...sc }; })
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || b.score - a.score);

const dates = [...new Set(events.map(e => e.date))];
const now = new Date().toISOString();
const doc = {
  note: 'Generated by tools/kw-music/update.mjs. Do not edit by hand.',
  checkedAt: now,
  keyWestToday: today,
  range: { from: dates[0] || null, to: dates[dates.length - 1] || null },
  sources: report,
  favorites: [...FAVORITES, ...CHASE].map(f => f.name),
  events,
};
await mkdir('data', { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(doc, null, 1) + '\n');
console.log(`Wrote ${events.length} sets, ${doc.range.from} to ${doc.range.to}`);
if (report.every(r => !r.ok)) { console.error('Every source failed.'); process.exitCode = 1; }
