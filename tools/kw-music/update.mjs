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

// ---------- Who we care about ----------
// FAVORITES: Brian's own picks (star, top score).
// ISLAND_TOP: the island's 3 most popular acts, from Key West's people's-choice awards
//   (the Bubbas), the Key West Music Awards (the Iggys) and the TripAdvisor Key West forum.
//   Researched Nov 2026; revisit each summer after the Bubbas. Caffeine Carl (the forum's #1)
//   passed away July 9, 2026; Nick Norman moved up from CHASE to take his place.
// CHASE: well-loved locals worth a detour.
//
// THE RULE (learned the hard way: Caffeine Carl was recommended months after he died):
// before adding anyone here, confirm they are alive AND playing Key West this month, and set
// `checked` to that date. `status` is a human-verified warning shown on the Radar in place of
// "nothing posted yet". The bot also flags anyone with no Key West gigs for 3 weeks, and anyone
// whose `checked` date is over 4 months old.
const FAVORITES = [
  { name: 'Raven', match: /\braven\b/i, checked: '2026-11-15', status: "Appears to have left Key West: off Schooner's calendar and playing the Tampa area (Dunedin) in 2026" },
  { name: 'Joe the Show', match: /joe\s*the\s*show/i },
  { name: 'Nick Brownell', match: /nick\s*brownw?ell/i }, // Schooner's calendar spells it Brownwell
  { name: 'Zach Lovering', match: /zach\s*lovering|tequila\s*time\s*machine/i },
  { name: 'Adam Lufkin (Luffkid)', match: /lufkin|luff\s*kid/i },
  { name: 'Dave Mininberg', match: /mininberg/i },
  { name: 'John Bartus', match: /bartus/i, checked: '2026-11-15', status: "Plays Marathon, not Key West: Sparky's Landing every Thursday 6:30 PM (an hour up US-1)" },
  { name: 'Tony Baltimore', match: /tony\s*baltimore/i },
];
const ISLAND_TOP = [
  { name: 'The Durtbags', match: /durtbag/i, why: "Bubbas Best Local Band finalist; forum favorite at Durty Harry's" },
  { name: 'Cliff Cody', match: /cliff\s*cody/i, why: 'Iggy Entertainer, Songwriter and Country Act of the Year' },
  { name: 'Nick Norman', match: /nick\s*norman/i, why: 'Former Bubbas Best Local Musician; one of the island\'s strongest draws' },
];
const CHASE = [
  { name: 'Scott Kirby', match: /scott\s*kirby/i },
  { name: 'Joal Rush', match: /jo[ae]l\s*rush/i, checked: '2026-11-15', status: 'Visits Key West a week at a time now (last there late Oct 2026); a bonus if he shows up' },
  { name: 'Drew Bear', match: /drew\s*bear|andrew\s*gordon/i },
];
for (const f of [...FAVORITES, ...ISLAND_TOP, ...CHASE]) f.checked = f.checked || '2026-11-15'; // all verified Nov 15, 2026
const NAMED = [...FAVORITES, ...ISLAND_TOP, ...CHASE];
// Plug-in calendar feeds. When a performer or bar shares a Google Calendar (or any .ics) link,
// add it here: { id, name, url, performer?, defaultVenue? }. It is pulled every run.
const CALENDAR_FEEDS = [
  // Example (the Durtbags' calendar is set to private right now, so it can't be read):
  // { id: 'durtbags', name: 'The Durtbags calendar', performer: 'The Durtbags',
  //   url: 'https://calendar.google.com/calendar/ical/<calendar id>/public/basic.ics' },
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
  { match: /durty\s*harry/i, weight: 15, why: "Durty Harry's: the Durtbags' home stage" },
  { match: /sloppy\s*joe/i, weight: 10, why: "Sloppy Joe's: always something on" },
  { match: /blue\s*heaven/i, weight: 10, why: 'Blue Heaven: courtyard music' },
  { match: /boat\s*house/i, weight: 10, why: 'Boat House: a regular lunch stop' },
];
const NOT_A_BAND = /karaoke|bingo|trivia|\bdj\b|comedy|tea dance|\btba\b|\btbd\b|closed|private event|drag|night off|ukulele night|open mic|jukebox|\bmagic\b/i;

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
  const end = addDays(today, src.days || 180);
  let url = `${src.url}?per_page=50&start_date=${today}&end_date=${end}`;
  for (let page = 0; page < (src.maxPages || 6) && url; page++) {
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
      let title = decode(e.title).replace(/\s*[–—-]\s*Key West,?\s*(FL|Florida)\s*$/i, '');
      if (src.stripAt) title = title.replace(/\s*@\s*[^@]+$/, '').trim(); // "Aaron Blumer @Hog's Breath"
      if (!title) continue;
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

// Convert a UTC instant to Key West date + 24h time.
function kwParts(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const isKeyWest = s => /key\s*west|stock\s*island|3304[05]/i.test(s) || VENUES.some(v => v.match.test(s));
const ymdT = v => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;

// 8. Any public calendar feed (.ics), e.g. a Google Calendar a performer shares.
async function icsFeed(src, today) {
  const txt = (await getText(src.url)).replace(/\r?\n[ \t]/g, ''); // unfold long lines
  if (!/BEGIN:VCALENDAR/.test(txt)) throw new Error('not a calendar feed');
  const unesc = v => decode(String(v || '').replace(/\\n/g, ' ').replace(/\\([,;\\])/g, '$1'));
  const out = [];
  for (const block of txt.split('BEGIN:VEVENT').slice(1)) {
    const field = name => { const m = block.match(new RegExp('^' + name + '(;[^:\\r\\n]*)?:(.*)$', 'm')); return m ? m[2].trim() : ''; };
    const v = field('DTSTART');
    const summary = unesc(field('SUMMARY'));
    const location = unesc(field('LOCATION'));
    if (!v || (!isKeyWest(location + ' ' + summary) && !src.defaultVenue)) continue;
    let date, time;
    if (/^\d{8}T\d{6}Z$/.test(v)) ({ date, time } = kwParts(new Date(`${ymdT(v)}T${v.slice(9, 11)}:${v.slice(11, 13)}:00Z`)));
    else if (/^\d{8}T\d{6}$/.test(v)) { date = ymdT(v); time = `${v.slice(9, 11)}:${v.slice(11, 13)}`; } // local (TZID) time
    else if (/^\d{8}$/.test(v)) { date = ymdT(v); time = '12:00'; }
    else continue;
    if (date < today) continue;
    const venue = (location.split(',')[0] || '').trim() || summary || src.defaultVenue || 'Venue TBA';
    const named = src.performer && new RegExp(src.performer.replace(/^the\s+/i, '').split(' ')[0], 'i').test(summary);
    const act = src.performer ? (named || !summary || summary === venue ? src.performer : `${src.performer}: ${summary}`) : summary;
    out.push({ date, time, act, venue, address: (location.split(',')[1] || '').trim() });
  }
  return out;
}

// 9. Cliff Cody: his shows page (Wix) carries an "add to Google Calendar" link per gig.
async function cliffCody(today) {
  const html = (await getText('https://www.cliffcody.com/tour')).replace(/\\\//g, '/').replace(/\\u0026/g, '&');
  const links = [...new Set(html.match(/calendar\.google\.com\/calendar\/render\?action=TEMPLATE[^"'\s<\\]+/g) || [])];
  if (!links.length) throw new Error('shows page loaded but no gigs found (layout may have changed)');
  const out = [];
  for (const l of links) {
    const q = new URLSearchParams(l.split('?')[1]);
    const m = (q.get('dates') || '').match(/^(\d{8})T(\d{6})Z/);
    const where = q.get('location') || '';
    const title = decode(q.get('text') || '');
    if (!m || !isKeyWest(where + ' ' + title)) continue;
    const { date, time } = kwParts(new Date(`${ymdT(m[1])}T${m[2].slice(0, 2)}:${m[2].slice(2, 4)}:00Z`));
    if (date >= today) out.push({ date, time, act: 'Cliff Cody', venue: title || where.split(',')[0], address: where.split(',')[0] });
  }
  return out;
}

// 10. Hand-entered lineups (from Brian's screenshots of Facebook / Instagram schedules).
// Lives in data/kw-music-manual.json: { "events": [ { "date": "2026-12-31", "time": "19:00",
// "act": "Raven Cooper", "venue": "Schooner Wharf Bar & Grill", "from": "Schooner FB, Dec 20" } ] }
async function manualEntries(today) {
  let doc;
  try { doc = JSON.parse(await readFile('data/kw-music-manual.json', 'utf8')); } catch { return []; }
  return (doc.events || []).filter(e => e.date && e.time && e.act && e.venue && e.date >= today)
    .map(e => ({ date: e.date, time: e.time, act: e.act, venue: e.venue, ...(e.from ? { note: 'From ' + e.from } : {}) }));
}

// 11. Schooner Wharf: a hand-built monthly calendar table (entertainment.htm). Rows alternate
// between a row of day numbers and a row of acts; each act line is followed by its time range.
function cellLines(html) {
  return html.replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n').split('\n').map(decode).filter(Boolean);
}
const fixCase = s => titleCase(s.toLowerCase()).replace(/\bBrownwell\b/, 'Brownell').replace(/\bO'm/, "O'M");
function parseSchooner(html, today) {
  const out = [];
  let year = null, month = null, days = null;
  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const head = decode(row).match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\s+Entertainment Schedule/i);
    if (head) { month = MONTHS[head[1].slice(0, 3).toLowerCase()]; year = Number(head[2]); days = null; continue; }
    if (!month) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cellLines(m[1]));
    if (cells.length !== 7) continue;
    const nums = cells.map(c => c.join(' ').match(/^(?:[A-Za-z]{3,9}\.?\s+)?(\d{1,2})$/));
    if (cells.some(c => c.length) && cells.every((c, i) => !c.length || nums[i])) { days = nums.map(n => n && Number(n[1])); continue; }
    if (!days) continue;
    cells.forEach((lines, i) => {
      if (!days[i]) return;
      const date = `${year}-${pad(month)}-${pad(days[i])}`;
      let name = [];
      for (const line of lines) {
        const t = line.replace(/\bnoon\b/i, '12pm');
        if (/^\d{1,2}(:\d{2})?\s*([ap]m)?\s*[-–]\s*(late|midnight|close|\d)/i.test(t)) {
          const time = rangeStart(t);
          if (name.length && time && date >= today) out.push({ date, time, act: fixCase(name.join(' ')), venue: 'Schooner Wharf Bar & Grill', address: '202 William St' });
          name = [];
        } else name.push(line);
      }
    });
    days = null;
  }
  return out;
}
async function schoonerWharf(today) {
  const html = await getText('https://www.schoonerwharf.com/entertainment.htm');
  if (!/Entertainment Schedule/i.test(html)) throw new Error('calendar page changed (no schedule heading)');
  return parseSchooner(html, today); // can legitimately be empty on the last day of a month
}

const SOURCES = [
  { id: 'livemusiceveryday', name: 'LiveMusicEveryDay (island-wide calendar)', url: 'https://livemusiceveryday.com/', run: t => tribeFeed({ url: 'https://livemusiceveryday.com/wp-json/tribe/events/v1/events', stripAt: true, days: 45, maxPages: 45 }, t) },
  { id: 'schooner', name: 'Schooner Wharf music calendar', url: 'https://www.schoonerwharf.com/entertainment.htm', run: t => schoonerWharf(t) },
  { id: 'keywesttourist', name: 'KeyWestTourist (about 30 bars)', url: 'https://www.keywesttourist.com/live-music/', run: () => keyWestTourist() },
  { id: 'greenparrot', name: 'Green Parrot calendar', url: 'https://greenparrot.com/key-west-live-music', run: t => greenParrot(t) },
  { id: 'zachlovering', name: 'Zach Lovering schedule', url: 'https://www.zachlovering.com/', run: t => zachLovering(t) },
  { id: 'mininberg', name: 'Dave Mininberg shows', url: 'https://www.davemininberg.com/upcoming', run: t => daveMininberg(t) },
  { id: 'joetheshow', name: 'Joe the Show calendar', url: 'https://joetheshow.com/', run: t => tribeFeed({ url: 'https://joetheshow.com/wp-json/tribe/events/v1/events', performer: 'Joe the Show' }, t) },
  { id: 'irishkevins', name: "Irish Kevin's calendar", url: 'https://irishkevins.com/', run: t => tribeFeed({ url: 'https://irishkevins.com/wp-json/tribe/events/v1/events', defaultVenue: "Irish Kevin's", defaultAddress: '211 Duval St' }, t) },
  { id: 'scottkirby', name: 'Scott Kirby calendar', url: 'https://www.scottkirby.com/', run: t => tribeFeed({ url: 'https://www.scottkirby.com/wp-json/tribe/events/v1/events', performer: 'Scott Kirby' }, t) },
  { id: 'cliffcody', name: 'Cliff Cody shows', url: 'https://www.cliffcody.com/tour', run: t => cliffCody(t) },
  ...CALENDAR_FEEDS.map(f => ({ id: f.id, name: f.name, url: f.url, run: t => icsFeed(f, t) })),
  { id: 'manual', name: 'Screenshot lineups (hand-entered)', url: 'data/kw-music-manual.json', run: t => manualEntries(t) },
];
// When two sources list the same venue, date and time, the later one in this list wins
// (direct venue and artist feeds beat the aggregator).
const MERGE_ORDER = ['livemusiceveryday', 'keywesttourist', 'schooner', 'irishkevins', 'greenparrot', 'joetheshow', 'scottkirby', 'zachlovering', 'mininberg', 'cliffcody', ...CALENDAR_FEEDS.map(f => f.id), 'manual'];

// ---------- Scoring ----------
// Normalized performer name: strips set times, "w/ guests", "Duo", "Band", etc.
function performerKey(act) {
  return act.toLowerCase()
    .replace(/^(joe the show|scott kirby|zach lovering|dave mininberg):.*$/, '$1')
    .replace(/\s+(at|w\/|with|featuring|feat\.?|&)\s.*$/, '')
    .replace(/\b(duo|trio|quartet|band|solo|soundcheck( set)?|and friends)\b/g, '')
    .replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
}
const titleCase = s => s.replace(/(^|\s)[a-z]/g, c => c.toUpperCase());

function score(ev) {
  let s = 0; const why = []; const tags = [];
  const fav = FAVORITES.find(f => f.match.test(ev.act));
  const top = ISLAND_TOP.find(f => f.match.test(ev.act));
  const chase = CHASE.find(f => f.match.test(ev.act));
  const venue = VENUES.find(v => v.match.test(ev.venue));
  if (fav) { s += 100; why.push(`Favorite: ${fav.name}`); tags.push('favorite'); }
  else if (top) { s += 90; why.push(`Island's most popular: ${top.name}`); tags.push('island'); }
  else if (chase) { s += 50; why.push(`One to chase: ${chase.name}`); tags.push('chase'); }
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
// Second dedupe key: a named act at the same venue on the same day is the same show (sources
// often disagree on start time); any other act at the same date and time is the same show.
const actKey = ev => {
  const f = NAMED.find(x => x.match.test(ev.act));
  return f ? `${ev.date}|${f.name}|${venueKey(ev.venue)}` : `${ev.date}|${ev.time}|${performerKey(ev.act)}`;
};

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

const events = base
  .map(ev => ({ ...ev, timeLabel: label12(ev.time), ...score(ev) }))
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || b.score - a.score);

// Radar: next posted date for every name worth tracking.
function nextFor(test) {
  const hits = events.filter(e => !e.tags.includes('not-a-band') && test(e));
  const n = hits[0];
  return { upcoming: hits.length, next: n ? { date: n.date, time: n.time, timeLabel: n.timeLabel, venue: n.venue, act: n.act } : null };
}
// Safety net: remember when each name's gigs dried up (carried over from the previous run), and
// flag anyone silent for 3 weeks or not human-verified in 4 months. Never "nothing posted yet"
// for someone who may be gone.
const prevRadar = Object.fromEntries(['favorites', 'island', 'chase'].flatMap(k => ((previous.radar || {})[k] || []).map(r => [r.name, r])));
function radarEntry(f, extra) {
  const r = { name: f.name, ...extra, ...nextFor(e => f.match.test(e.act)) };
  const prev = prevRadar[f.name] || {};
  r.missingSince = r.upcoming ? null : (prev.missingSince || today);
  r.checked = f.checked;
  if (f.status) r.status = f.status;
  r.silent = !r.upcoming && r.missingSince <= addDays(today, -21);
  r.verifyDue = f.checked < addDays(today, -120);
  return r;
}
const radar = {
  favorites: FAVORITES.map(f => radarEntry(f, {})),
  island: ISLAND_TOP.map(f => radarEntry(f, { why: f.why })),
  chase: CHASE.map(f => radarEntry(f, {})),
};
const flagged = Object.values(radar).flat().filter(r => r.silent || r.verifyDue).map(r => r.name);
if (flagged.length) console.log('VERIFY THESE NAMES (silent 3+ weeks or not checked in 4 months): ' + flagged.join(', '));

const dates = [...new Set(events.map(e => e.date))];
const doc = {
  note: 'Generated by tools/kw-music/update.mjs. Do not edit by hand.',
  checkedAt: new Date().toISOString(),
  keyWestToday: today,
  range: { from: dates[0] || null, to: dates[dates.length - 1] || null },
  sources: report,
  favorites: NAMED.map(f => f.name),
  radar,
  events,
};
await mkdir('data', { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(doc, null, 1) + '\n');
console.log(`Wrote ${events.length} sets, ${doc.range.from} to ${doc.range.to}. Island top: ${radar.island.map(r => `${r.name} (${r.upcoming})`).join('; ')}`);
if (report.every(r => !r.ok)) { console.error('Every source failed.'); process.exitCode = 1; }
