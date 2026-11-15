// Key West live music updater.
// Runs on GitHub Actions every 4 hours (see .github/workflows/kw-music.yml).
// Pulls venue, performer and Key West calendar schedules, scores each set for the Cooney crew,
// and writes data/kw-music.json, which key_west.html reads. No dependencies: plain Node 20.
//
// Safety rules:
//  - A source that fails keeps its previous events (never wipes good data on a bad fetch).
//  - Only Key West and Stock Island events are kept.
//  - Past days are dropped; everything from "today in Key West" forward is kept.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT_FILE = 'data/kw-music.json';
const UA = 'Mozilla/5.0 (compatible; CooneyVacationPortal/1.0; +https://vacation.cooneysparadise.com/)';
const TZ = 'America/New_York';
const HOT_WINDOW_DAYS = 14; // "Hot right now" looks at the next two weeks
const HOT_COUNT = 3;

// ---------- Who we care about ----------
// FAVORITES get a star and the top score. CHASE names are well-loved locals worth a detour.
// "Hot right now" (the 3 most-booked performers) is calculated from the data every run.
const FAVORITES = [
  { name: 'Raven', match: /\braven\b/i },
  { name: 'Joe the Show', match: /joe\s*the\s*show/i },
  { name: 'Nick Brownell', match: /nick\s*brownell/i },
  { name: 'Zach Lovering', match: /zach\s*lovering|tequila\s*time\s*machine/i },
  { name: 'Adam Lufkin (Luffkid)', match: /lufkin|luff\s*kid/i },
  { name: 'Dave Mininberg', match: /mininberg/i },
  { name: 'John Bartus', match: /bartus/i },
];
const CHASE = [
  { name: 'Scott Kirby', match: /scott\s*kirby/i },
  { name: 'Caffeine Carl', match: /caffeine\s*carl/i },
  { name: 'Drew Bear', match: /drew\s*bear|andrew\s*gordon/i },
];
// Venue weights: Brian's top venue first, then the ones already in the app.
const VENUES = [
  { match: /green\s*parrot/i, weight: 40, why: 'Green Parrot: your top venue' },
  { match: /smokin'?g?\s*tuna/i, weight: 35, why: "Smokin' Tuna: you're overdue" },
  { match: /schooner/i, weight: 35, why: "Schooner Wharf: Raven's home stage" },
  { match: /rick'?s/i, weight: 20, why: "Rick's: Joe the Show's home turf" },
  { match: /irish\s*kevin/i, weight: 20, why: "Irish Kevin's: a regular stop" },
  { match: /hog'?s\s*breath/i, weight: 15, why: "Hog's Breath: two blocks from the Galleon" },
  { match: /hank'?s/i, weight: 15, why: "Hank's: Garbo's is in the yard" },
  { match: /hogfish/i, weight: 15, why: 'Hogfish: minutes from Beach House' },
  { match: /sunset\s*tiki/i, weight: 15, why: "Sunset Tiki Bar: it's at the Galleon" },
  { match: /willie\s*t/i, weight: 15, why: "Willie T's: a regular stop" },
  { match: /general\s*horseplay/i, weight: 10, why: 'General Horseplay: looper central' },
  { match: /sloppy\s*joe/i, weight: 10, why: "Sloppy Joe's: always something on" },
  { match: /blue\s*heaven/i, weight: 10, why: 'Blue Heaven: courtyard music' },
  { match: /boat\s*house/i, weight: 10, why: 'Boat House: a regular lunch stop' },
];
const NOT_A_BAND = /karaoke|bingo|trivia|\bdj\b|comedy|tea dance|\btba\b|\btbd\b|closed|private event|drag|night off|ukulele night|open mic|jukebox/i;

// ---------- Helpers ----------
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (dateStr, n) => { const d = new Date(dateStr + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };

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

function keyWestToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// "1:00 PM" -> "13:00"
function to24(label) {
  const m = String(label).match(/(\d{1,2}):(\d{2})\s*([AP])M/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'P') h += 12;
  return `${pad(h)}:${m[2]}`;
}
// Start time from a range like "7–11 PM", "6:30–9:30 PM", "10 PM–close", "11–2 PM"
function rangeStart(text) {
  const t = String(text).replace(/[–—]/g, '-');
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)?\s*(?:-|to)\s*(\d{1,2})?(?::\d{2})?\s*([AP]M)?/i) || t.match(/(\d{1,2})(?::(\d{2}))?\s*([AP]M)/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] || '00';
  let mark = (m[3] || m[5] || 'PM').toUpperCase();
  if (!m[3] && m[4] && Number(m[4]) < h && h !== 12 && mark === 'PM') mark = 'AM'; // "11-2 PM" starts in the morning
  h = (h % 12) + (mark === 'PM' ? 12 : 0);
  return `${pad(h)}:${min}`;
}
function label12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

async function getText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const t = await r.text();
  if (/please wait while your request is being verified|cf-challenge/i.test(t)) throw new Error('blocked by a bot check');
  return t;
}

// ---------- Source parsers ----------
// 1. KeyWestTourist: about 30 bars, roughly 9 days ahead, as venue cards.
async function keyWestTourist() {
  const html = await getText('https://www.keywesttourist.com/live-music/');
  const out = [];
  for (const a of html.match(/<article class="venue">[\s\S]*?<\/article>/g) || []) {
    const venue = decode((a.match(/venue__name">([^<]+)/) || [])[1]);
    const dm = decode((a.match(/venue__date">([^<]+)/) || [])[1]).match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/);
    if (!venue || !dm) continue;
    const date = `${dm[3]}-${pad(MONTHS[dm[1].toLowerCase()])}-${pad(dm[2])}`;
    for (const [, t, act] of a.matchAll(/setrow__time">([^<]*)<\/span>\s*<span class="setrow__act">([^<]*)<\/span>/g)) {
      const time = to24(t);
      if (time) out.push({ date, time, act: decode(act), venue });
    }
  }
  if (!out.length) throw new Error('page loaded but no venue sets were found (layout may have changed)');
  return out;
}

// 2. Green Parrot: its calendar widget (Elfsight) holds every booking, months ahead.
async function greenParrot(today) {
  const W = '5973ebdd-dc35-4ffa-aa30-4fb4a705fc6f';
  const url = 'https://core.service.elfsight.com/p/boot/?page=' + encodeURIComponent('https://greenparrot.com/key-west-live-music') + '&w=' + W;
  const data = JSON.parse(await getText(url));
  const s = data?.data?.widgets?.[W]?.data?.settings;
  if (!s || !Array.isArray(s.events)) throw new Error('widget data not found (layout may have changed)');
  const types = Object.fromEntries((s.eventTypes || []).map(t => [t.id, t.name]));
  const horizon = addDays(today, 180);
  const out = [];
  const push = (date, e) => {
    if (date < today || date > horizon) return;
    const name = decode(e.name);
    const sets = (name.match(/\bat\s+(\d{1,2}:\d{2}.*)$/i) || [])[1];
    const kind = (e.eventType || []).map(id => types[id]).filter(Boolean).join(', ');
    out.push({
      date, time: (e.start?.time || '17:30').slice(0, 5),
      act: name.replace(/\s+at\s+\d{1,2}:\d{2}.*$/i, '').trim(),
      venue: 'Green Parrot Bar', address: '601 Whitehead St',
      ...(sets ? { note: 'Sets at ' + sets } : {}),
      ...(/live music/i.test(kind) || !kind ? {} : { kind }),
    });
  };
  for (const e of s.events) {
    const start = e.start?.date;
    if (!start) continue;
    if (e.repeatPeriod === 'noRepeat' || !e.repeatPeriod) { push(start, e); continue; }
    // Weekly repeats (rare): expand on the chosen weekdays until the end date.
    if (e.repeatFrequency === 'weekly' && Array.isArray(e.repeatWeeklyOnDays)) {
      const end = e.repeatEndsDate?.date || horizon;
      const skip = new Set((e.exceptions || []).map(x => x?.date || x));
      for (let d = start; d <= end && d <= horizon; d = addDays(d, 1)) {
        const wd = DAYS[new Date(d + 'T12:00:00Z').getUTCDay()].slice(0, 2);
        if (e.repeatWeeklyOnDays.includes(wd) && !skip.has(d)) push(d, e);
      }
    }
  }
  return out;
}

// 3-5. WordPress "The Events Calendar" feeds (Joe the Show, Irish Kevin's, Scott Kirby).
async function tribeFeed(src, today) {
  const out = []; out.raw = 0; out.droppedNotKW = [];
  const end = addDays(today, 180);
  let url = `${src.url}?per_page=50&start_date=${today}&end_date=${end}`;
  for (let page = 0; page < 6 && url; page++) {
    const data = JSON.parse(await getText(url));
    for (const e of data.events || []) {
      out.raw++;
      const v = (e.venue && !Array.isArray(e.venue)) ? e.venue : {};
      const venue = decode(v.venue) || src.defaultVenue || '';
      const city = decode(v.city);
      const isKW = /key\s*west|stock\s*island/i.test(city) || (!city && (src.defaultVenue || VENUES.some(x => x.match.test(venue))));
      if (!isKW) { if (out.droppedNotKW.length < 5) out.droppedNotKW.push(`${venue || '?'} / ${city || '?'}`); continue; }
      const [d, t] = String(e.start_date || '').split(' ');
      if (!d || !t) continue;
      const title = decode(e.title).replace(/\s*[–—-]\s*Key West,?\s*(FL|Florida)\s*$/i, '');
      out.push({
        date: d, time: e.all_day ? '12:00' : t.slice(0, 5),
        act: src.performer && !new RegExp(src.performer.split(' ')[0], 'i').test(title) ? `${src.performer}: ${title}` : title,
        venue: venue || 'Venue TBA', address: decode(v.address) || src.defaultAddress || '',
      });
    }
    url = data.next_rest_url || null;
  }
  return out;
}

// 6. Zach Lovering: his site's weekly schedule file (shows.js). Parsed as text, never executed.
async function zachLovering(today) {
  const js = await getText('https://www.zachlovering.com/shows.js');
  const out = [];
  const weeks = js.split(/\{\s*start:\s*\[/).slice(1);
  if (!weeks.length) throw new Error('schedule file found but no weeks in it (layout may have changed)');
  for (const w of weeks) {
    const sm = w.match(/^(\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\]/);
    if (!sm) continue;
    const monday = `${sm[1]}-${pad(sm[2])}-${pad(sm[3])}`;
    for (const row of w.matchAll(/\{\s*day:\s*"(\w+)"([^}]*)\}/g)) {
      const body = row[2];
      const get = k => (body.match(new RegExp(k + ':\\s*"([^"]*)"')) || [])[1] || '';
      if (/off:\s*true/.test(body)) continue;
      const place = get('place');
      if (place && !/key\s*west|stock\s*island/i.test(place)) continue; // out-of-town gig
      const offset = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(row[1].toLowerCase());
      const time = rangeStart(get('time'));
      if (offset < 0 || !time) continue;
      const date = addDays(monday, offset);
      if (date < today) continue;
      const note = get('note');
      out.push({ date, time, act: /tequila/i.test(note) ? 'Zach Lovering: Tequila Time Machine' : 'Zach Lovering', venue: get('venue'), ...(note ? { note } : {}) });
    }
  }
  return out;
}

// 7. Dave Mininberg: Squarespace "Upcoming Shows" page. JSON first, then the HTML list.
async function daveMininberg(today) {
  const out = [];
  let items = null;
  try {
    const j = JSON.parse(await getText('https://www.davemininberg.com/upcoming?format=json'));
    items = j.upcoming || j.items || [];
  } catch { /* fall back to HTML */ }
  if (items) {
    for (const it of items) {
      const loc = it.location || {};
      const where = [loc.addressTitle, loc.addressLine1, loc.addressLine2].map(decode).join(' ');
      if (!/key\s*west|stock\s*island/i.test(where)) continue;
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(it.startDate)).map(x => [x.type, x.value]));
      const date = `${p.year}-${p.month}-${p.day}`;
      const title = decode(it.title);
      const venue = decode(loc.addressTitle) || 'Venue TBA';
      const titleIsVenue = !title || /mininberg/i.test(title) || title.toLowerCase().startsWith(venue.toLowerCase().split(' ')[0]);
      if (date >= today) out.push({ date, time: `${p.hour}:${p.minute}`, act: 'Dave Mininberg' + (titleIsVenue ? '' : ': ' + title), venue, address: decode(loc.addressLine1) });
    }
    return out;
  }
  const html = await getText('https://www.davemininberg.com/upcoming');
  for (const a of html.match(/<article class="eventlist-event[\s\S]*?<\/article>/g) || []) {
    const date = (a.match(/event-date[^>]*datetime="(\d{4}-\d{2}-\d{2})"/) || [])[1];
    const time = to24(decode((a.match(/event-time-12hr[^>]*>([^<]+)/) || [])[1]));
    const where = decode((a.match(/eventlist-meta-address[^>]*>([\s\S]*?)<\/li>/) || [])[1]);
    const title = decode((a.match(/eventlist-title-link[^>]*>([^<]+)/) || [])[1]);
    if (!date || date < today || !/key\s*west|stock\s*island/i.test(where)) continue;
    out.push({ date, time: time || '12:00', act: 'Dave Mininberg' + (title && !/mininberg/i.test(title) ? ': ' + title : ''), venue: where.split(/\s{2,}|,/)[0] || 'Venue TBA' });
  }
  return out;
}

const SOURCES = [
  { id: 'keywesttourist', name: 'KeyWestTourist (about 30 bars)', url: 'https://www.keywesttourist.com/live-music/', run: () => keyWestTourist() },
  { id: 'greenparrot', name: 'Green Parrot calendar', url: 'https://greenparrot.com/key-west-live-music', run: t => greenParrot(t) },
  { id: 'zachlovering', name: 'Zach Lovering schedule', url: 'https://www.zachlovering.com/', run: t => zachLovering(t) },
  { id: 'mininberg', name: 'Dave Mininberg shows', url: 'https://www.davemininberg.com/upcoming', run: t => daveMininberg(t) },
  { id: 'joetheshow', name: 'Joe the Show calendar', url: 'https://joetheshow.com/', run: t => tribeFeed({ url: 'https://joetheshow.com/wp-json/tribe/events/v1/events', performer: 'Joe the Show' }, t) },
  { id: 'irishkevins', name: "Irish Kevin's calendar", url: 'https://irishkevins.com/', run: t => tribeFeed({ url: 'https://irishkevins.com/wp-json/tribe/events/v1/events', defaultVenue: "Irish Kevin's", defaultAddress: '211 Duval St' }, t) },
  { id: 'scottkirby', name: 'Scott Kirby calendar', url: 'https://www.scottkirby.com/', run: t => tribeFeed({ url: 'https://www.scottkirby.com/wp-json/tribe/events/v1/events', performer: 'Scott Kirby' }, t) },
];
// When two sources list the same venue, date and time, the later one in this list wins
// (direct venue and artist feeds beat the aggregator).
const MERGE_ORDER = ['keywesttourist', 'irishkevins', 'greenparrot', 'joetheshow', 'scottkirby', 'zachlovering', 'mininberg'];

// ---------- Scoring ----------
// Performer name used for "Hot right now": strips set times, "w/ guests", "Duo", "Band", etc.
function performerKey(act) {
  return act.toLowerCase()
    .replace(/^(joe the show|scott kirby|zach lovering|dave mininberg):.*$/, '$1')
    .replace(/\s+(at|w\/|with|featuring|feat\.?|&)\s.*$/, '')
    .replace(/\b(duo|trio|quartet|band|solo|soundcheck( set)?|and friends)\b/g, '')
    .replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
}
const titleCase = s => s.replace(/(^|\s)[a-z]/g, c => c.toUpperCase());

function score(ev, hotSet) {
  let s = 0; const why = []; const tags = [];
  const fav = FAVORITES.find(f => f.match.test(ev.act));
  const chase = CHASE.find(f => f.match.test(ev.act));
  const hot = hotSet.get(performerKey(ev.act));
  const venue = VENUES.find(v => v.match.test(ev.venue));
  if (fav) { s += 100; why.push(`Favorite: ${fav.name}`); tags.push('favorite'); }
  else if (chase) { s += 50; why.push(`One to chase: ${chase.name}`); tags.push('chase'); }
  else if (hot) { s += 30; why.push(`Hot right now: ${hot}`); tags.push('hot'); }
  if (venue) { s += venue.weight; why.push(venue.why); }
  const h = Number(ev.time.slice(0, 2));
  if (h >= 13 && h <= 22) s += 5; // fits the noon-to-late day
  if (NOT_A_BAND.test(ev.act) || ev.kind) { s -= 80; tags.push('not-a-band'); }
  return { score: s, why, tags };
}

// Different sources spell venues differently; map them to one name so maps and dedupe line up.
const VENUE_ALIASES = [
  [/smok(in|ing)'?\s*tuna/i, "Smokin' Tuna Saloon"],
  [/\bhalo\b/i, 'Halo Rooftop Lounge'],
  [/green\s*parrot/i, 'Green Parrot Bar'],
  [/irish\s*kevin/i, "Irish Kevin's"],
  [/^rick'?s\b/i, "Rick's Bar Key West"],
  [/hog'?s\s*breath/i, "Hog's Breath Saloon"],
  [/schooner/i, 'Schooner Wharf Bar & Grill'],
];
const canonVenue = v => (VENUE_ALIASES.find(([re]) => re.test(v)) || [null, v])[1];
const venueKey = v => canonVenue(v).toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
const key = ev => `${ev.date}|${ev.time}|${venueKey(ev.venue)}`;
// Second dedupe key: the same performer at the same date and time is the same show,
// even if two sources name the venue differently.
const actKey = ev => { const f = FAVORITES.find(x => x.match.test(ev.act)); return `${ev.date}|${ev.time}|${f ? f.name : performerKey(ev.act)}`; };

// ---------- Main ----------
const today = keyWestToday();
let previous = { events: [] };
try { previous = JSON.parse(await readFile(OUT_FILE, 'utf8')); } catch { /* first run */ }

const report = [];
const bySource = {};
for (const src of SOURCES) {
  const rec = { id: src.id, name: src.name, url: src.url, ok: false, count: 0 };
  try {
    const evs = await src.run(today);
    bySource[src.id] = evs.map(e => ({ ...e, source: src.id }));
    rec.ok = true; rec.count = evs.length;
    if (evs.raw !== undefined) { rec.raw = evs.raw; if (evs.droppedNotKW.length) rec.droppedNotKW = evs.droppedNotKW; }
  } catch (e) {
    rec.error = String(e.message || e);
    bySource[src.id] = (previous.events || []).filter(e => e.source === src.id && e.date >= today);
    rec.count = bySource[src.id].length; rec.keptPrevious = true;
  }
  report.push(rec);
  console.log(`${rec.ok ? 'OK  ' : 'FAIL'} ${src.id}: ${rec.count} sets${rec.raw !== undefined ? ` (feed had ${rec.raw})` : ''} ${rec.error ? '(' + rec.error + ')' : ''}`);
}

const merged = new Map();  // venue key -> event
const byAct = new Map();   // act key -> venue key
for (const id of MERGE_ORDER) {
  for (const raw of bySource[id] || []) {
    if (raw.date < today) continue;
    const ev = { ...raw, venue: canonVenue(raw.venue) };
    const ak = actKey(ev);
    if (byAct.has(ak)) merged.delete(byAct.get(ak)); // same show from an earlier source
    merged.set(key(ev), ev);
    byAct.set(ak, key(ev));
  }
}
const base = [...merged.values()];

// "Hot right now": performers booked at the most different venues in the next two weeks
// (then most sets). Favorites and chase names are excluded since they're already featured.
const windowEnd = addDays(today, HOT_WINDOW_DAYS);
const tally = new Map();
for (const ev of base) {
  if (ev.date > windowEnd || NOT_A_BAND.test(ev.act) || ev.kind) continue;
  if (FAVORITES.some(f => f.match.test(ev.act)) || CHASE.some(f => f.match.test(ev.act))) continue;
  const k = performerKey(ev.act);
  if (!k || k.length < 3) continue;
  const t = tally.get(k) || { key: k, name: titleCase(k), venues: new Set(), sets: 0 };
  t.venues.add(venueKey(ev.venue)); t.sets++;
  tally.set(k, t);
}
const hotList = [...tally.values()].sort((a, b) => b.venues.size - a.venues.size || b.sets - a.sets).slice(0, HOT_COUNT);
const hotSet = new Map(hotList.map(h => [h.key, h.name]));

const events = base
  .map(ev => ({ ...ev, timeLabel: label12(ev.time), ...score(ev, hotSet) }))
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || b.score - a.score);

// Radar: next posted date for every name worth tracking.
function nextFor(test) {
  const hits = events.filter(e => !e.tags.includes('not-a-band') && test(e));
  const n = hits[0];
  return { upcoming: hits.length, next: n ? { date: n.date, time: n.time, timeLabel: n.timeLabel, venue: n.venue, act: n.act } : null };
}
const radar = {
  favorites: FAVORITES.map(f => ({ name: f.name, ...nextFor(e => f.match.test(e.act)) })),
  hot: hotList.map(h => ({ name: h.name, venues: h.venues.size, sets: h.sets, ...nextFor(e => performerKey(e.act) === h.key) })),
  chase: CHASE.map(f => ({ name: f.name, ...nextFor(e => f.match.test(e.act)) })),
};

const dates = [...new Set(events.map(e => e.date))];
const doc = {
  note: 'Generated by tools/kw-music/update.mjs. Do not edit by hand.',
  checkedAt: new Date().toISOString(),
  keyWestToday: today,
  range: { from: dates[0] || null, to: dates[dates.length - 1] || null },
  sources: report,
  favorites: [...FAVORITES, ...CHASE].map(f => f.name),
  radar,
  events,
};
await mkdir('data', { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(doc, null, 1) + '\n');
console.log(`Wrote ${events.length} sets, ${doc.range.from} to ${doc.range.to}. Hot: ${hotList.map(h => `${h.name} (${h.venues.size} venues, ${h.sets} sets)`).join('; ')}`);
if (report.every(r => !r.ok)) { console.error('Every source failed.'); process.exitCode = 1; }
