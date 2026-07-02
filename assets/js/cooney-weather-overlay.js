/* Cooney Weather Overlay + Safe Vacation Audio Controller
   Version v25
   - Loads weather from Open-Meteo without an API key
   - Shows funny weather overlay on itinerary pages
   - Selects weather music from assets/audio/*.m4a
   - Uses ONE audio element only; prevents stacked songs
   - Removes target=_blank from .html itinerary links so old-tab music does not keep playing behind the new page
*/
(function () {
  'use strict';

  const CFG = window.COONEY_VACATION_CONFIG || {};
  const PAGE_PATH = (window.location.pathname || '').toLowerCase();
  const PAGE_NAME = PAGE_PATH.split('/').pop() || 'index.html';
  const IS_HOME = PAGE_NAME === '' || PAGE_NAME === 'index.html';

  const LOCATIONS = {
    home: { label: 'Cape May Launch Weather', place: 'Cape May, NJ', lat: 38.9351, lon: -74.9060 },
    cape: { label: 'Cape May Weather Check', place: 'Cape May, NJ', lat: 38.9351, lon: -74.9060 },
    avalon: { label: 'Avalon Weather Check', place: 'Avalon, NJ', lat: 39.1012, lon: -74.7177 },
    ac: { label: 'Atlantic City Weather Check', place: 'Atlantic City, NJ', lat: 39.3643, lon: -74.4229 }
  };

  function pageKey() {
    if (PAGE_NAME.includes('avalon')) return 'avalon';
    if (PAGE_NAME.includes('atlantic')) return 'ac';
    if (PAGE_NAME.includes('cape')) return 'cape';
    return 'home';
  }

  const LOCATION = LOCATIONS[pageKey()] || LOCATIONS.home;
  const COLD_BELOW_F = Number(CFG.coldBelowF || 60);

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function safeText(value) {
    return String(value == null ? '' : value).replace(/[<>&]/g, function (ch) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[ch];
    });
  }

  function normalizeSongList(category) {
    const list = (CFG.weatherSongs && CFG.weatherSongs[category]) || [];
    return list.map(function (item) {
      if (typeof item === 'string') return item;
      if (item && typeof item.file === 'string') return item.file;
      return null;
    }).filter(Boolean);
  }

  function pickTrack(category) {
    let songs = normalizeSongList(category);
    if (!songs.length && category !== 'perfect') songs = normalizeSongList('perfect');
    if (!songs.length) songs = ['assets/audio/perfect-1.m4a'];

    const lastKey = 'cooney-last-track-' + category;
    const lastTrack = localStorage.getItem(lastKey);
    let choices = songs;
    if (songs.length > 1) {
      choices = songs.filter(function (song) { return song !== lastTrack; });
      if (!choices.length) choices = songs;
    }
    const chosen = pick(choices);
    localStorage.setItem(lastKey, chosen);
    localStorage.setItem('cooney-selected-weather-category', category);
    localStorage.setItem('cooney-selected-weather-track', chosen);
    window.COONEY_SELECTED_WEATHER_CATEGORY = category;
    window.COONEY_SELECTED_WEATHER_TRACK = chosen;
    return chosen;
  }

  function getAudio() {
    let audio = document.getElementById('cooneyAudio');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'cooneyAudio';
      audio.preload = 'auto';
      audio.loop = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
    }
    audio.loop = true;
    window.COONEY_AUDIO = audio;
    return audio;
  }

  function stopAllAudio(exceptAudio) {
    $all('audio').forEach(function (a) {
      if (exceptAudio && a === exceptAudio) return;
      try { a.pause(); a.currentTime = 0; } catch (e) {}
    });
  }

  function announceStopOtherTabs() {
    const payload = JSON.stringify({ ts: Date.now(), page: PAGE_NAME, cmd: 'stop-audio' });
    try { localStorage.setItem('cooney-audio-command', payload); } catch (e) {}
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('cooney-vacation-audio');
        bc.postMessage({ cmd: 'stop-audio', page: PAGE_NAME, ts: Date.now() });
        setTimeout(function () { try { bc.close(); } catch (e) {} }, 250);
      }
    } catch (e) {}
  }

  function installCrossTabAudioStop() {
    window.addEventListener('storage', function (ev) {
      if (ev.key === 'cooney-audio-command' && ev.newValue) stopAllAudio();
    });
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel('cooney-vacation-audio');
        bc.onmessage = function (ev) {
          if (ev.data && ev.data.cmd === 'stop-audio') stopAllAudio();
        };
      }
    } catch (e) {}
  }

  function setAudioSource(trackPath) {
    const audio = getAudio();
    const absolute = new URL(trackPath, window.location.href).href;
    stopAllAudio(audio);
    if (audio.src !== absolute) {
      try { audio.pause(); audio.currentTime = 0; } catch (e) {}
      audio.src = trackPath;
      audio.load();
    }
    audio.onerror = function () {
      // Common repo typo protection: if Windy-2.m4a was uploaded with uppercase W, try it.
      if ((trackPath || '').includes('windy-2.m4a')) {
        audio.onerror = null;
        audio.src = 'assets/audio/Windy-2.m4a';
        try { audio.load(); } catch (e) {}
      }
    };
    updateNowPlaying(trackPath);
    return audio;
  }

  async function playSelectedTrack() {
    const track = window.COONEY_SELECTED_WEATHER_TRACK || localStorage.getItem('cooney-selected-weather-track') || pickTrack('perfect');
    const audio = setAudioSource(track);
    announceStopOtherTabs();
    stopAllAudio(audio);
    try {
      audio.volume = 0.82;
      await audio.play();
      localStorage.setItem('cooneyVacationMode', 'active');
      syncButtons(true);
    } catch (err) {
      console.warn('Cooney music could not start:', err);
    }
  }

  function stopVacationMusic() {
    stopAllAudio();
    announceStopOtherTabs();
    localStorage.setItem('cooneyVacationMode', 'inactive');
    syncButtons(false);
  }

  function isVacationActive() {
    return localStorage.getItem('cooneyVacationMode') === 'active';
  }

  function syncButtons(active) {
    $all('#activateVacationMode, #cooneyOverlayActivate').forEach(function (btn) {
      if (!btn) return;
      if (btn.id === 'cooneyOverlayActivate' && active) return;
      if (btn.id === 'activateVacationMode') {
        btn.className = 'cooney-vacation-button' + (active ? ' deactivate' : '');
        btn.innerHTML = active ? '<span>💩 🛑 Deactivate Vacation Mode (Loser)</span>' : '<span>🎉 Activate Vacation Mode</span>';
      }
    });
    const pp = document.getElementById('cooneyPlayPause');
    if (pp) pp.textContent = active ? 'Pause' : 'Play';
    const bar = document.getElementById('cooneyMusicbar');
    if (bar && active) bar.style.display = 'flex';
  }

  function updateNowPlaying(trackPath) {
    const bar = document.getElementById('cooneyMusicbar');
    if (!bar) return;
    let label = bar.querySelector('.cooney-now-playing');
    if (!label) {
      label = document.createElement('span');
      label.className = 'cooney-now-playing';
      label.style.fontWeight = '800';
      label.style.marginLeft = '8px';
      bar.appendChild(label);
    }
    const cat = window.COONEY_SELECTED_WEATHER_CATEGORY || localStorage.getItem('cooney-selected-weather-category') || 'perfect';
    const file = (trackPath || '').split('/').pop() || trackPath;
    label.textContent = 'Weather track: ' + cat.toUpperCase() + ' • ' + file;
  }

  function installAudioHijack() {
    installCrossTabAudioStop();

    // Stop the old-tab music problem: itinerary HTML links must open in the SAME tab.
    $all('a[href$=".html"]').forEach(function (a) {
      a.removeAttribute('target');
      a.removeAttribute('rel');
      a.addEventListener('click', function () { stopVacationMusic(); }, { capture: true });
    });

    // PDF links can still open in new tabs.
    $all('a[href$=".pdf"]').forEach(function (a) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });

    // Make sure any play event kills duplicate audio tags.
    document.addEventListener('play', function (ev) {
      if (ev.target && ev.target.tagName === 'AUDIO') {
        announceStopOtherTabs();
        stopAllAudio(ev.target);
      }
    }, true);

    // Capture phase: set the correct weather song before the old Cape May button script plays.
    ['activateVacationMode', 'cooneyOverlayActivate'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (id === 'activateVacationMode' && isVacationActive()) {
          // Let the old Cape May deactivation effects run, but kill audio first so nothing stacks.
          stopVacationMusic();
        } else {
          const track = window.COONEY_SELECTED_WEATHER_TRACK || localStorage.getItem('cooney-selected-weather-track') || pickTrack('perfect');
          setAudioSource(track);
          announceStopOtherTabs();
        }
      }, { capture: true });
    });
  }

  function codeLabel(code) {
    const c = Number(code);
    if ([95, 96, 99].includes(c)) return 'Storms';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'Rain';
    if ([51, 53, 55, 56, 57].includes(c)) return 'Drizzle';
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'Snow';
    if ([45, 48].includes(c)) return 'Fog';
    if ([1, 2, 3].includes(c)) return c === 3 ? 'Cloudy' : 'Partly Cloudy';
    return 'Clear';
  }

  function moodForPeriod(p) {
    const code = Number(p.code || 0);
    const temp = Number(p.tempF || 0);
    const precip = Number(p.precip || 0);
    const wind = Number(p.wind || 0);
    const cloud = Number(p.cloud || 0);
    if ([95, 96, 99].includes(code)) return 'storm';
    if ([61, 63, 65, 66, 67, 80, 81, 82, 51, 53, 55, 56, 57].includes(code) || precip >= 45) return 'rain';
    if (temp < COLD_BELOW_F) return 'cold';
    if (temp >= 88) return 'hot';
    if (wind >= 22) return 'windy';
    if (cloud >= 70 || code === 3) return 'cloudy';
    return 'perfect';
  }

  function overallMood(periods) {
    const moods = periods.map(moodForPeriod);
    if (moods.includes('storm')) return 'storm';
    if (moods.includes('rain')) return 'rain';
    if (moods.includes('cold')) return 'cold';
    if (moods.includes('hot')) return 'hot';
    if (moods.includes('windy')) return 'windy';
    if (moods.includes('cloudy')) return 'cloudy';
    return 'perfect';
  }

  function periodFromHourly(hourly, dateISO, name, startHour, endHour) {
    const rows = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const t = hourly.time[i];
      if (!t || !t.startsWith(dateISO + 'T')) continue;
      const hour = Number(t.slice(11, 13));
      if (hour >= startHour && hour <= endHour) {
        rows.push({
          tempF: Number(hourly.temperature_2m[i]),
          precip: Number(hourly.precipitation_probability[i] || 0),
          code: Number(hourly.weather_code[i] || 0),
          cloud: Number(hourly.cloud_cover[i] || 0),
          wind: Number(hourly.wind_speed_10m[i] || 0)
        });
      }
    }
    if (!rows.length) return { name: name, tempF: 0, precip: 0, code: 0, cloud: 0, wind: 0, condition: 'Unavailable', mood: 'perfect' };
    const avg = function (key) { return rows.reduce(function (sum, r) { return sum + Number(r[key] || 0); }, 0) / rows.length; };
    const max = function (key) { return Math.max.apply(null, rows.map(function (r) { return Number(r[key] || 0); })); };
    const severeCode = rows.map(function (r) { return r.code; }).sort(function (a, b) { return severity(b) - severity(a); })[0];
    const p = {
      name: name,
      tempF: Math.round(avg('tempF')),
      precip: Math.round(max('precip')),
      code: severeCode,
      cloud: Math.round(avg('cloud')),
      wind: Math.round(max('wind')),
      condition: codeLabel(severeCode)
    };
    p.mood = moodForPeriod(p);
    return p;
  }

  function severity(code) {
    if ([95, 96, 99].includes(code)) return 100;
    if ([80, 81, 82, 61, 63, 65, 66, 67].includes(code)) return 80;
    if ([51, 53, 55, 56, 57].includes(code)) return 60;
    if ([45, 48].includes(code)) return 40;
    if (code === 3) return 30;
    if ([1, 2].includes(code)) return 20;
    return 10;
  }

  function todayTomorrowDates() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const iso = function (d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    };
    return { today: iso(today), tomorrow: iso(tomorrow) };
  }

  async function fetchWeather() {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + encodeURIComponent(LOCATION.lat)
      + '&longitude=' + encodeURIComponent(LOCATION.lon)
      + '&hourly=temperature_2m,precipitation_probability,weather_code,cloud_cover,wind_speed_10m'
      + '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'
      + '&forecast_days=3&timezone=auto';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Weather fetch failed: ' + res.status);
    return res.json();
  }

  function installOverlayCSS() {
    if (document.getElementById('cooney-weather-overlay-css')) return;
    const style = document.createElement('style');
    style.id = 'cooney-weather-overlay-css';
    style.textContent = `
      .cooney-weather-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at top,rgba(255,255,255,.18),transparent 36%),rgba(0,0,0,.64);backdrop-filter:blur(8px)}
      .cooney-weather-card{width:min(980px,96vw);max-height:90vh;overflow:auto;border-radius:28px;border:1px solid rgba(255,255,255,.24);background:linear-gradient(135deg,rgba(10,24,48,.96),rgba(88,21,36,.96));box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.18);color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;padding:24px;position:relative}
      .cooney-weather-card h2{margin:0 0 6px;font-size:clamp(30px,5vw,58px);line-height:.95;text-transform:uppercase;letter-spacing:-.04em}.cooney-weather-card .place{font-weight:900;color:#ffe7a5;text-transform:uppercase;letter-spacing:.12em;font-size:13px}.cooney-weather-quip{font-size:clamp(18px,2.4vw,28px);font-weight:900;margin:16px 0;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}
      .cooney-weather-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.cooney-weather-period{border-radius:18px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);padding:13px}.cooney-weather-period b{display:block;font-size:16px;color:#fff}.cooney-weather-period span{display:block;margin-top:6px;color:rgba(255,255,255,.86);font-size:14px;line-height:1.25}.cooney-weather-music{margin-top:16px;border-radius:18px;padding:13px 15px;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.15);font-weight:850}.cooney-weather-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.cooney-weather-actions button{border:0;border-radius:999px;padding:12px 18px;font-weight:1000;cursor:pointer;text-transform:uppercase}.cooney-weather-close{background:#ffe7a5;color:#13234a}.cooney-weather-snooze{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.22)!important}
      @media(max-width:680px){.cooney-weather-grid{grid-template-columns:1fr}.cooney-weather-card{padding:20px;border-radius:22px}.cooney-weather-overlay{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function quipForMood(mood) {
    const list = (CFG.quips && CFG.quips[mood]) || (CFG.quips && CFG.quips.perfect) || ['Vacation weather has entered the chat.'];
    return pick(list);
  }

  function showWeatherOverlay(periods, mood, track) {
    if (IS_HOME) return; // Home page keeps the launch overlay clean but still gets weather-selected music.
    installOverlayCSS();
    const existing = document.getElementById('cooneyWeatherOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cooneyWeatherOverlay';
    overlay.className = 'cooney-weather-overlay';
    overlay.innerHTML = `
      <div class="cooney-weather-card" role="dialog" aria-modal="true" aria-label="Weather check">
        <div class="place">${safeText(LOCATION.place)}</div>
        <h2>Weather Check</h2>
        <div class="cooney-weather-quip">${safeText(quipForMood(mood))}</div>
        <div class="cooney-weather-grid">
          ${periods.map(function (p) {
            return `<div class="cooney-weather-period"><b>${safeText(p.name)}</b><span>${safeText(p.condition)} • ${safeText(p.tempF)}°F</span><span>Rain ${safeText(p.precip)}% • Wind ${safeText(p.wind)} mph</span></div>`;
          }).join('')}
        </div>
        <div class="cooney-weather-music">🎵 Vacation Mode loaded: <b>${safeText(mood.toUpperCase())}</b> track • ${safeText((track || '').split('/').pop())}</div>
        <div class="cooney-weather-actions">
          <button class="cooney-weather-close" type="button">Bring on Vacation Mode</button>
          <button class="cooney-weather-snooze" type="button">Close Weather</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () { overlay.remove(); });
    });
  }

  function fallbackWeatherSetup() {
    const fallback = [{ name: 'Weather', tempF: 72, precip: 0, wind: 0, cloud: 0, code: 0, condition: 'Forecast Loading', mood: 'perfect' }];
    const mood = 'perfect';
    const track = pickTrack(mood);
    setAudioSource(track);
    if (!IS_HOME) showWeatherOverlay(fallback, mood, track);
  }

  async function initWeather() {
    try {
      const data = await fetchWeather();
      const d = todayTomorrowDates();
      const periods = [
        periodFromHourly(data.hourly, d.today, 'Today Morning', 6, 11),
        periodFromHourly(data.hourly, d.today, 'Today Afternoon', 12, 17),
        periodFromHourly(data.hourly, d.today, 'Today Night', 18, 23),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Morning', 6, 11),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Afternoon', 12, 17),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Night', 18, 23)
      ];
      const mood = overallMood(periods);
      const track = pickTrack(mood);
      setAudioSource(track);
      showWeatherOverlay(periods, mood, track);
    } catch (err) {
      console.warn('Cooney weather overlay fallback:', err);
      fallbackWeatherSetup();
    }
  }

  function init() {
    installAudioHijack();
    initWeather();
    // One more pass after the old inline scripts mutate links/buttons.
    setTimeout(installAudioHijack, 250);
    setTimeout(function () {
      const track = window.COONEY_SELECTED_WEATHER_TRACK || localStorage.getItem('cooney-selected-weather-track');
      if (track) setAudioSource(track);
    }, 600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.COONEY_STOP_VACATION_MUSIC = stopVacationMusic;
  window.COONEY_PLAY_SELECTED_WEATHER_TRACK = playSelectedTrack;
})();
