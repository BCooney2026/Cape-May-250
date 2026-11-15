// One-time discovery #2: performer sites, Bandsintown, Hog's Breath, Green Parrot widget, general KW calendars.
import { mkdir, writeFile } from 'node:fs/promises';
const OUT = 'tools/kw-music/discovery6';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const enc = encodeURIComponent;
const ARTISTS = ['Raven Cooper', 'Joe the Show', 'Nick Brownell', 'Zach Lovering', 'LuFFKiD', 'Adam Lufkin', 'Dave Mininberg', 'David Mininberg', 'John Bartus', 'Scott Kirby', 'Caffeine Carl'];
const URLS = ["https://calendar.google.com/calendar/ical/f7e6ccd58e61be3daa7c56b5e55bc4a39cabd41747e68f805d7e6759f597a68a%40group.calendar.google.com/public/basic.ics", "https://calendar.google.com/calendar/ical/f7e6ccd58e61be3daa7c56b5e55bc4a39cabd41747e68f805d7e6759f597a68a@group.calendar.google.com/public/basic.ics", "https://calendar.google.com/calendar/ical/f7e6ccd58e61be3daa7c56b5e55bc4a39cabd41747e68f805d7e6759f597a68a%40group.calendar.google.com/public/full.ics", "https://calendar.google.com/calendar/embed?src=f7e6ccd58e61be3daa7c56b5e55bc4a39cabd41747e68f805d7e6759f597a68a%40group.calendar.google.com&ctz=America%2FNew_York&mode=AGENDA", "https://calendar.google.com/calendar/htmlembed?src=f7e6ccd58e61be3daa7c56b5e55bc4a39cabd41747e68f805d7e6759f597a68a%40group.calendar.google.com&ctz=America/New_York&mode=AGENDA"];
const slug = u => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 140);
const report = [];
await mkdir(`${OUT}/raw`, { recursive: true });
for (const url of URLS) {
  const rec = { url };
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    rec.status = r.status; rec.finalUrl = r.url; rec.type = r.headers.get('content-type');
    const t = await r.text();
    rec.bytes = t.length; rec.file = slug(url) + '.txt';
    rec.challenge = /request is being verified|cf-challenge|captcha/i.test(t);
    rec.jsonld = (t.match(/"@type"\s*:\s*"(Music)?Event"/g) || []).length;
    rec.tribe = /tribe-events|the-events-calendar/i.test(t);
    rec.ics = [...new Set((t.match(/(webcal:[^"' <]+|https?:[^"' <]+\?ical=1[^"' <]*)/g) || []))].slice(0, 3);
    await writeFile(`${OUT}/raw/${rec.file}`, t);
  } catch (e) { rec.error = String(e.cause?.code || e.message || e); }
  report.push(rec);
  console.log(`${rec.status || 'ERR'} ${rec.bytes || ''} ${url.slice(0, 110)} ${rec.error || ''}${rec.challenge ? ' CHALLENGE' : ''}${rec.jsonld ? ' jsonld=' + rec.jsonld : ''}`);
}
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 1));
