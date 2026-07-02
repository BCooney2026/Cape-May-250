/* Cooney Weather Overlay + Vacation Audio Controller
   Version v26
   HARD RULES:
   - This file does NOT touch assets/audio/.
   - Uses the existing #cooneyAudio element so Cape May button effects keep working.
   - Weather overlay is real fixed overlay with inline styles so it cannot fall to bottom of page.
   - Audio never stacks: one Cooney audio element, one active track, deactivate stops it.
*/
(function () {
  'use strict';

  const CFG = window.COONEY_VACATION_CONFIG || {};
  const PAGE_PATH = (window.location.pathname || '').toLowerCase();
  const PAGE_NAME = PAGE_PATH.split('/').pop() || 'index.html';
  const IS_HOME = PAGE_NAME === '' || PAGE_NAME === 'index.html';

  const LOCATIONS = {
    home:   { place: 'Cape May, NJ',       lat: 38.9351, lon: -74.9060 },
    cape:   { place: 'Cape May, NJ',       lat: 38.9351, lon: -74.9060 },
    avalon: { place: 'Avalon, NJ',         lat: 39.1012, lon: -74.7177 },
    ac:     { place: 'Atlantic City, NJ',  lat: 39.3643, lon: -74.4229 }
  };

  function pageKey() {
    if (PAGE_NAME.includes('avalon')) return 'avalon';
    if (PAGE_NAME.includes('atlantic')) return 'ac';
    if (PAGE_NAME.includes('cape')) return 'cape';
    return 'home';
  }

  const LOCATION = LOCATIONS[pageKey()] || LOCATIONS.home;
  const COLD_BELOW_F = Number(CFG.coldBelowF || 60);

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[<>&"]/g, function (ch) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[ch];
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

  function getCooneyAudio() {
    let audio = document.getElementById('cooneyAudio');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'cooneyAudio';
      document.body.appendChild(audio);
    }
    audio.loop = true;
    audio.preload = 'auto';
    audio.style.display = 'none';
    window.COONEY_AUDIO = audio;
    return audio;
  }

  function stopOtherAudio(except) {
    qsa('audio').forEach(function (a) {
      if (except && a === except) return;
      try { a.pause(); a.currentTime = 0; } catch (e) {}
    });
  }

  function hardStopAllAudio() {
    qsa('audio').forEach(function (a) {
      try { a.pause(); a.currentTime = 0; } catch (e) {}
    });
  }

  function sameFile(a, b) {
    try { return new URL(a, window.location.href).href === new URL(b, window.location.href).href; }
    catch (e) { return a === b; }
  }

  function setAudioSource(trackPath) {
    const audio = getCooneyAudio();
    const track = trackPath || window.COONEY_SELECTED_WEATHER_TRACK || localStorage.getItem('cooney-selected-weather-track') || pickTrack('perfect');

    stopOtherAudio(audio);

    if (!audio.src || !sameFile(audio.src, track)) {
      try { audio.pause(); audio.currentTime = 0; } catch (e) {}
      audio.src = track;
      audio.load();
    }

    audio.onerror = function () {
      // Safety fallback only. If a selected file is missing, try perfect-1.
      if (!sameFile(audio.src, 'assets/audio/perfect-1.m4a')) {
        audio.onerror = null;
        audio.src = 'assets/audio/perfect-1.m4a';
        try { audio.load(); } catch (e) {}
      }
    };

    updateMusicBar(track);
    return audio;
  }

  async function playSelectedWeatherTrack() {
    const track = window.COONEY_SELECTED_WEATHER_TRACK || localStorage.getItem('cooney-selected-weather-track') || pickTrack('perfect');
    const audio = setAudioSource(track);
    stopOtherAudio(audio);
    try {
      audio.volume = 0.86;
      await audio.play();
      localStorage.setItem('cooneyVacationMode', 'active');
      syncButtons(true);
      showMusicBar(true);
      return true;
    } catch (err) {
      console.warn('Cooney music could not start:', err);
      return false;
    }
  }

  function stopVacationMusic() {
    hardStopAllAudio();
    localStorage.setItem('cooneyVacationMode', 'inactive');
    syncButtons(false);
    showMusicBar(true, false);
  }

  function syncButtons(active) {
    qsa('#activateVacationMode').forEach(function (btn) {
      btn.className = 'cooney-vacation-button' + (active ? ' deactivate' : '');
      btn.innerHTML = active ? '<span>💩 🛑 Deactivate Vacation Mode (Loser)</span>' : '<span>🎉 Activate Vacation Mode</span>';
    });
    const pp = document.getElementById('cooneyPlayPause');
    if (pp) pp.textContent = active ? 'Pause' : 'Play';
  }

  function showMusicBar(show, playing) {
    const bar = document.getElementById('cooneyMusicbar');
    if (bar && show) bar.style.display = 'flex';
    const pp = document.getElementById('cooneyPlayPause');
    if (pp && typeof playing === 'boolean') pp.textContent = playing ? 'Pause' : 'Play';
  }

  function updateMusicBar(trackPath) {
    const bar = document.getElementById('cooneyMusicbar');
    if (!bar) return;
    const cat = window.COONEY_SELECTED_WEATHER_CATEGORY || localStorage.getItem('cooney-selected-weather-category') || 'perfect';
    const file = (trackPath || '').split('/').pop() || trackPath || '';
    const track = bar.querySelector('.cooney-track');
    if (track) {
      track.innerHTML = '<strong>Now Playing: Weather Mode — ' + esc(cat.toUpperCase()) + '</strong><span>' + esc(file) + '</span>';
    }
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

  function severity(code) {
    if ([95, 96, 99].includes(code)) return 100;
    if ([80, 81, 82, 61, 63, 65, 66, 67].includes(code)) return 80;
    if ([51, 53, 55, 56, 57].includes(code)) return 60;
    if ([45, 48].includes(code)) return 40;
    if (code === 3) return 30;
    if ([1, 2].includes(code)) return 20;
    return 10;
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

  function todayTomorrowDates() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const iso = function (d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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

  function quipForMood(mood) {
    const list = (CFG.quips && CFG.quips[mood]) || (CFG.quips && CFG.quips.perfect) || ['Vacation weather has entered the chat.'];
    return pick(list);
  }

  function showWeatherOverlay(periods, mood, track) {
    if (IS_HOME) return;
    const old = document.getElementById('cooneyWeatherOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cooneyWeatherOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:22px!important;background:rgba(0,0,0,.68)!important;backdrop-filter:blur(8px)!important;box-sizing:border-box!important;';

    const card = document.createElement('div');
    card.style.cssText = 'width:min(980px,96vw)!important;max-height:90vh!important;overflow:auto!important;border-radius:28px!important;border:1px solid rgba(255,255,255,.24)!important;background:linear-gradient(135deg,rgba(10,24,48,.97),rgba(88,21,36,.97))!important;box-shadow:0 30px 90px rgba(0,0,0,.60)!important;color:#fff!important;font-family:system-ui,-apple-system,Segoe UI,sans-serif!important;padding:24px!important;box-sizing:border-box!important;';

    const grid = periods.map(function (p) {
      return '<div style="border-radius:18px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);padding:13px;box-sizing:border-box;">'
        + '<b style="display:block;font-size:16px;color:#fff;">' + esc(p.name) + '</b>'
        + '<span style="display:block;margin-top:6px;color:rgba(255,255,255,.88);font-size:14px;line-height:1.25;">' + esc(p.condition) + ' • ' + esc(p.tempF) + '°F</span>'
        + '<span style="display:block;margin-top:6px;color:rgba(255,255,255,.88);font-size:14px;line-height:1.25;">Rain ' + esc(p.precip) + '% • Wind ' + esc(p.wind) + ' mph</span>'
        + '</div>';
    }).join('');

    card.innerHTML = '<div style="font-weight:900;color:#ffe7a5;text-transform:uppercase;letter-spacing:.12em;font-size:13px;">' + esc(LOCATION.place) + '</div>'
      + '<h2 style="margin:0 0 6px;font-size:clamp(30px,5vw,58px);line-height:.95;text-transform:uppercase;letter-spacing:-.04em;color:#fff;">Weather Check</h2>'
      + '<div style="font-size:clamp(18px,2.4vw,28px);font-weight:900;margin:16px 0;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);">' + esc(quipForMood(mood)) + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:14px;">' + grid + '</div>'
      + '<div style="margin-top:16px;border-radius:18px;padding:13px 15px;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.15);font-weight:850;">🎵 Vacation Mode loaded: <b>' + esc(mood.toUpperCase()) + '</b> track • ' + esc((track || '').split('/').pop()) + '</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">'
      + '<button id="cooneyWeatherActivate" type="button" style="border:0;border-radius:999px;padding:12px 18px;font-weight:1000;cursor:pointer;text-transform:uppercase;background:#ffe7a5;color:#13234a;">Bring on Vacation Mode</button>'
      + '<button id="cooneyWeatherClose" type="button" style="border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:12px 18px;font-weight:1000;cursor:pointer;text-transform:uppercase;background:rgba(255,255,255,.16);color:#fff;">Close Weather</button>'
      + '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('cooneyWeatherClose').addEventListener('click', function () { overlay.remove(); });
    document.getElementById('cooneyWeatherActivate').addEventListener('click', function () {
      overlay.remove();
      const btn = document.getElementById('activateVacationMode');
      if (btn) btn.click();
      else playSelectedWeatherTrack();
    });
  }

  function fallbackWeatherSetup() {
    const fallback = [{ name: 'Weather', tempF: 72, precip: 0, wind: 0, cloud: 0, code: 0, condition: 'Forecast Loading', mood: 'perfect' }];
    const mood = 'perfect';
    const track = pickTrack(mood);
    setAudioSource(track);
    showWeatherOverlay(fallback, mood, track);
  }

  async function initWeather() {
    // Start with a safe default immediately so the button has something to play.
    if (!window.COONEY_SELECTED_WEATHER_TRACK && !localStorage.getItem('cooney-selected-weather-track')) {
      setAudioSource(pickTrack('perfect'));
    }

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

  function installLinkRules() {
    qsa('a[href$=".html"]').forEach(function (a) { a.removeAttribute('target'); a.removeAttribute('rel'); });
    qsa('a[href$=".pdf"]').forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
  }

  function init() {
    installLinkRules();
    initWeather();
    setTimeout(installLinkRules, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.COONEY_PICK_WEATHER_TRACK = pickTrack;
  window.COONEY_SET_AUDIO_SOURCE = setAudioSource;
  window.COONEY_PLAY_SELECTED_WEATHER_TRACK = playSelectedWeatherTrack;
  window.COONEY_STOP_VACATION_MUSIC = stopVacationMusic;
})();
