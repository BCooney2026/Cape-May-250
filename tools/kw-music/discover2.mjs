// One-time discovery #2: performer sites, Bandsintown, Hog's Breath, Green Parrot widget, general KW calendars.
import { mkdir, writeFile } from 'node:fs/promises';
const OUT = 'tools/kw-music/discovery2';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const enc = encodeURIComponent;
const ARTISTS = ['Raven Cooper', 'Joe the Show', 'Nick Brownell', 'Zach Lovering', 'LuFFKiD', 'Adam Lufkin', 'Dave Mininberg', 'David Mininberg', 'John Bartus', 'Scott Kirby', 'Caffeine Carl'];
const URLS = [
  // Green Parrot Elfsight widget
  'https://core.service.elfsight.com/p/boot/?page=' + enc('https://greenparrot.com/key-west-live-music') + '&w=5973ebdd-dc35-4ffa-aa30-4fb4a705fc6f',
  'https://greenparrot.com/key-west-live-music?format=json',
  // Hog's Breath
  'https://www.hogsbreath.com/events/', 'https://www.hogsbreath.com/music/', 'https://www.hogsbreath.com/keywest/events/',
  'https://www.hogsbreath.com/keywest/wp-json/tribe/events/v1/events?per_page=50', 'https://www.hogsbreath.com/events/zach-lovering/', 'https://www.hogsbreath.com/events/adam-lufkin/',
  // General calendars
  'https://www.keywesttourist.com/live-entertainment/', 'https://www.keywesttourist.com/live-music/?date=2026-11-28',
  'https://events.keysweekly.com/category/live-music', 'https://events.keysweekly.com/',
  'https://www.keywestmusicmagazine.com/', 'https://keywestmusicmagazine.com/schedule/',
  'https://www.songkick.com/metro-areas/84661-us-key-west', 'https://www.bandsintown.com/c/key-west-fl',
  'https://fla-keys.com/calendar/', 'https://www.fla-keys.com/calendar/live-music/key-west/',
  // Performer sites (guesses; failures are expected)
  'https://www.johnbartus.com/', 'https://johnbartus.com/calendar/', 'https://johnbartus.com/wp-json/tribe/events/v1/events',
  'https://www.nickbrownell.com/', 'https://www.nickbrownellmusic.com/', 'https://www.zachlovering.com/', 'https://www.zachloveringlive.com/',
  'https://www.luffkid.com/', 'https://www.adamlufkin.com/', 'https://www.davidmininberg.com/', 'https://www.musicisaminivacation.com/',
  'https://www.ravencoopermusic.com/', 'https://www.ravencooper.net/', 'https://www.ravencooperkeywest.com/',
  // Other bars from the looper list
  'https://www.hogfishbar.com/', 'https://www.halorooftopkeywest.com/', 'https://www.generalhorseplay.com/', 'https://www.maryellenskw.com/', 'https://www.islanddogsbar.com/',
  ...ARTISTS.map(a => `https://rest.bandsintown.com/artists/${enc(a)}/events?app_id=cooney-vacation-portal&date=upcoming`),
  ...ARTISTS.map(a => `https://rest.bandsintown.com/artists/${enc(a)}?app_id=cooney-vacation-portal`),
];
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
