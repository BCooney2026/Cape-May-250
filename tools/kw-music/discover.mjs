// One-time discovery: fetch candidate Key West venue pages, save raw HTML, and report
// what calendar tech each site uses (iCal, Google Calendar, JSON-LD, widgets).
import { mkdir, writeFile } from 'node:fs/promises';
const OUT = 'tools/kw-music/discovery';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const SEEDS = [
  'https://www.schoonerwharf.com/', 'https://www.schoonerwharf.com/entertainment.htm', 'https://www.schoonerwharf.com/Entertainment.htm', 'https://www.schoonerwharf.com/Bios.htm',
  'https://www.greenparrot.com/', 'https://www.greenparrot.com/calendar', 'https://www.greenparrot.com/events', 'https://www.greenparrot.com/music',
  'https://www.smokintunasaloon.com/', 'https://smokintunasaloon.com/music', 'https://www.smokintuna.com/',
  'https://www.rickskeywest.com/', 'https://www.rickskeywest.com/entertainment',
  'https://www.sloppyjoes.com/', 'https://www.sloppyjoes.com/entertainment',
  'https://www.hogsbreath.com/', 'https://www.hogsbreath.com/key-west/entertainment/',
  'https://www.williets.com/', 'https://irishkevins.com/', 'https://irishkevins.com/entertainment/',
  'https://www.keywesttheater.com/', 'https://www.keywesttheater.com/events',
  'https://www.keywesttourist.com/festivals-events/', 'https://keysweekly.com/calendar/',
  'https://www.ravencooper.com/', 'https://www.joetheshow.com/', 'https://www.scottkirby.com/', 'https://www.scottkirby.com/tour',
  'https://www.caffeinecarl.com/', 'https://www.pepeskeywest.com/'
];
const KEY = /calendar|event|entertain|music|schedule|lineup|bands|shows|tour|live/i;
const report = [];
const seen = new Set();
const slug = u => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 120);
function analyze(url, html) {
  const ics = [...html.matchAll(/(https?:[^"' >]+\.ics[^"' >]*|webcal:[^"' >]+)/gi)].map(m => m[1]);
  const gcal = [...html.matchAll(/calendar\.google\.com\/calendar\/[^"' >]+/gi)].map(m => m[0]);
  const iframes = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)/gi)].map(m => m[1]);
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(m => m[1]).filter(s => /event|calendar|timely|tockify|elfsight|eventbrite|boomte|inffuse|sociablekit|wix|squarespace|tribe|bandsintown|songkick/i.test(s));
  const jsonld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(t => /Event/.test(t)).length;
  const gen = (html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i) || [])[1] || '';
  const wpTribe = /tribe-events|the-events-calendar/i.test(html);
  return { ics: [...new Set(ics)].slice(0, 10), gcal: [...new Set(gcal)].slice(0, 10), iframes: iframes.slice(0, 15), widgetScripts: scripts.slice(0, 15), jsonldEvents: jsonld, generator: gen, wpTribe, bytes: html.length };
}
async function grab(url, depth) {
  if (seen.has(url)) return; seen.add(url);
  let rec = { url, depth };
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    rec.status = r.status; rec.finalUrl = r.url;
    const html = await r.text();
    rec.file = slug(r.url) + '.html';
    await writeFile(`${OUT}/raw/${rec.file}`, html);
    Object.assign(rec, analyze(r.url, html));
    if (depth === 0 && r.ok) {
      const host = new URL(r.url).host;
      const links = [...html.matchAll(/href=["']([^"'#]+)/gi)].map(m => { try { return new URL(m[1], r.url).href; } catch { return null; } })
        .filter(h => h && new URL(h).host === host && KEY.test(h) && !/\.(jpg|png|pdf|css|js)(\?|$)/i.test(h));
      rec.followed = [...new Set(links)].slice(0, 8);
      for (const l of rec.followed) await grab(l, 1);
    }
  } catch (e) { rec.error = String(e.message || e); }
  report.push(rec);
}
await mkdir(`${OUT}/raw`, { recursive: true });
for (const s of SEEDS) await grab(s, 0);
// WordPress Events Calendar REST probes
for (const base of ['https://irishkevins.com', 'https://www.hogsbreath.com', 'https://www.sloppyjoes.com', 'https://www.greenparrot.com', 'https://keysweekly.com']) {
  await grab(base + '/wp-json/tribe/events/v1/events?per_page=5', 2);
}
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 1));
console.log(report.map(r => `${r.status || 'ERR'} ${r.url} ${r.error || ''}`).join('\n'));
