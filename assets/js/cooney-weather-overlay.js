/* Cooney Weather Vacation Mode Controller v29
   HARD SAFETY RULES:
   - This file does NOT touch assets/audio/.
   - Homepage landing anthem is always assets/audio/perfect-1.m4a.
   - Destination pages use a Weather Vacation Mode button.
   - Weather song is chosen only when the Weather Vacation Mode button is clicked.
   - No audio stacks: one #cooneyAudio element controls everything.
*/
(function () {
  'use strict';

  const CFG = window.COONEY_VACATION_CONFIG || {};
  const LAUNCH_SONG = CFG.launchSong || 'assets/audio/perfect-1.m4a';
  const PAGE_PATH = (window.location.pathname || '').toLowerCase();
  const PAGE_NAME = PAGE_PATH.split('/').pop() || 'index.html';
  const IS_HOME = PAGE_NAME === '' || PAGE_NAME === 'index.html';
  const DESTINATION_PAGES = ['cape_may.html', 'avalon.html', 'atlantic_city.html'];
  const IS_DESTINATION = DESTINATION_PAGES.some(function (name) { return PAGE_NAME.indexOf(name.replace('.html', '')) >= 0; });

  const LOCATIONS = {
    home:   { place: 'Cape May, NJ',      lat: 38.9351, lon: -74.9060 },
    cape:   { place: 'Cape May, NJ',      lat: 38.9351, lon: -74.9060 },
    avalon: { place: 'Avalon, NJ',        lat: 39.1012, lon: -74.7177 },
    ac:     { place: 'Atlantic City, NJ', lat: 39.3643, lon: -74.4229 }
  };

  function pageKey() {
    if (PAGE_NAME.indexOf('avalon') >= 0) return 'avalon';
    if (PAGE_NAME.indexOf('atlantic') >= 0) return 'ac';
    if (PAGE_NAME.indexOf('cape') >= 0) return 'cape';
    return 'home';
  }

  const LOCATION = LOCATIONS[pageKey()] || LOCATIONS.home;
  const COLD_BELOW_F = Number(CFG.coldBelowF || 60);
  let weatherCache = null;
  let weatherPromise = null;
  let weatherModeActive = false;
  let launchModeActive = false;

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[<>&"]/g, function (ch) {
      return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[ch];
    });
  }

  function injectControllerStyles() {
    if (document.getElementById('cooneyWeatherControllerStyleV29')) return;
    const style = document.createElement('style');
    style.id = 'cooneyWeatherControllerStyleV29';
    style.textContent = `

      body.cooney-destination-ready #cooneyStartOverlay{
        display:none!important; visibility:hidden!important; opacity:0!important; pointer-events:none!important;
      }
      #cooneyWeatherOverlay{
        position:fixed!important; inset:0!important; z-index:2147483646!important;
        display:flex!important; align-items:center!important; justify-content:center!important;
        padding:clamp(14px,3vw,28px)!important; background:rgba(1,7,20,.74)!important;
        backdrop-filter:blur(9px) saturate(1.15)!important; -webkit-backdrop-filter:blur(9px) saturate(1.15)!important;
        box-sizing:border-box!important; cursor:pointer!important;
      }
      #cooneyWeatherOverlay .cooney-weather-card{
        width:min(1040px,96vw)!important; max-height:90vh!important; overflow:auto!important;
        border-radius:32px!important; border:1px solid rgba(255,255,255,.25)!important;
        background:
          radial-gradient(circle at 18% 8%,rgba(255,231,165,.22),transparent 28%),
          radial-gradient(circle at 92% 0%,rgba(99,214,255,.20),transparent 26%),
          linear-gradient(135deg,rgba(9,29,62,.98),rgba(83,18,43,.98) 62%,rgba(6,12,26,.98))!important;
        box-shadow:0 35px 110px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.22)!important;
        color:white!important; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;
        padding:clamp(20px,3vw,34px)!important; box-sizing:border-box!important; cursor:default!important;
      }
      #cooneyWeatherOverlay .cooney-weather-kicker{
        font-size:13px!important; letter-spacing:.16em!important; text-transform:uppercase!important; font-weight:1000!important; color:#ffe7a5!important;
      }
      #cooneyWeatherOverlay .cooney-weather-title{
        margin:6px 0 8px!important; font-size:clamp(34px,6vw,72px)!important; line-height:.88!important;
        letter-spacing:-.06em!important; text-transform:uppercase!important; font-weight:1000!important; color:#fff!important;
        text-shadow:0 8px 30px rgba(0,0,0,.38)!important;
      }
      #cooneyWeatherOverlay .cooney-weather-quip{
        margin:18px 0!important; padding:16px 18px!important; border-radius:20px!important;
        background:rgba(255,255,255,.13)!important; border:1px solid rgba(255,255,255,.18)!important;
        font-size:clamp(19px,2.6vw,31px)!important; line-height:1.08!important; font-weight:950!important;
      }
      #cooneyWeatherOverlay .cooney-weather-grid{
        display:grid!important; grid-template-columns:repeat(auto-fit,minmax(178px,1fr))!important; gap:12px!important; margin-top:14px!important;
      }
      #cooneyWeatherOverlay .cooney-weather-period{
        border-radius:20px!important; padding:14px!important; background:rgba(255,255,255,.105)!important;
        border:1px solid rgba(255,255,255,.16)!important; box-shadow:inset 0 1px 0 rgba(255,255,255,.11)!important;
      }
      #cooneyWeatherOverlay .cooney-weather-period b{display:block!important;font-size:16px!important;color:#fff!important;}
      #cooneyWeatherOverlay .cooney-weather-period span{display:block!important;margin-top:6px!important;font-size:14px!important;color:rgba(255,255,255,.88)!important;line-height:1.25!important;}
      #cooneyWeatherOverlay .cooney-weather-trackline{
        margin-top:16px!important; border-radius:18px!important; padding:13px 15px!important;
        background:rgba(0,0,0,.24)!important; border:1px solid rgba(255,255,255,.15)!important; font-weight:900!important;
      }
    `;
    document.head.appendChild(style);
  }

  function getAudio() {
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
      try { a.pause(); a.currentTime = 0; } catch (err) {}
    });
  }

  function sameFile(a, b) {
    try { return new URL(a, window.location.href).href === new URL(b, window.location.href).href; }
    catch (err) { return a === b; }
  }

  function setTrack(trackPath, startSeconds) {
    const audio = getAudio();
    stopOtherAudio(audio);
    if (!audio.src || !sameFile(audio.src, trackPath)) {
      try { audio.pause(); audio.currentTime = 0; } catch (err) {}
      audio.src = trackPath;
      try { audio.load(); } catch (err) {}
    }
    if (typeof startSeconds === 'number' && isFinite(startSeconds) && startSeconds > 0) {
      try { audio.currentTime = Math.max(0, startSeconds); } catch (err) {}
    }
    return audio;
  }

  async function playTrack(trackPath, options) {
    options = options || {};
    const audio = setTrack(trackPath, options.startSeconds);
    stopOtherAudio(audio);
    try {
      audio.volume = options.volume == null ? 0.86 : options.volume;
      await audio.play();
      updateMusicBar(trackPath, options.label || 'Vacation Mode');
      return true;
    } catch (err) {
      console.warn('Cooney audio could not start:', err);
      return false;
    }
  }

  function stopAllAudio() {
    qsa('audio').forEach(function (a) {
      try { a.pause(); a.currentTime = 0; } catch (err) {}
    });
    try { localStorage.setItem('cooneyWeatherModeActive', 'inactive'); } catch (err) {}
    weatherModeActive = false;
    launchModeActive = false;
    syncButtons(false);
  }

  function normalizeSongList(category) {
    const list = (CFG.weatherSongs && CFG.weatherSongs[category]) || [];
    return list.map(function (item) {
      if (typeof item === 'string') return item;
      if (item && typeof item.file === 'string') return item.file;
      return null;
    }).filter(Boolean);
  }

  function pickTrackNoRepeat(category) {
    let songs = normalizeSongList(category);
    if (!songs.length && category !== 'perfect') songs = normalizeSongList('perfect');
    if (!songs.length) songs = [LAUNCH_SONG];

    const lastKey = 'cooney-last-weather-track-' + category;
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

  function showPop(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function partyLayer() { return document.getElementById('cooneyPartyLayer'); }
  function clearLayerLater() {
    const layer = partyLayer();
    if (!layer) return;
    setTimeout(function () { if (layer) layer.innerHTML = ''; }, 5400);
  }

  function activationEffects() {
    const layer = partyLayer();
    const colors = ['#c82333', '#ffffff', '#244678', '#d3a347', '#6ed3e7', '#fff4c4'];
    if (layer) {
      layer.innerHTML = '';
      for (let i = 0; i < 95; i++) {
        const el = document.createElement('span');
        el.className = 'confetti-piece';
        el.style.left = rand(0, 100) + 'vw';
        el.style.background = pick(colors);
        el.style.animationDuration = rand(2.2, 4.8) + 's';
        el.style.animationDelay = rand(0, .7) + 's';
        el.style.width = rand(6, 13) + 'px';
        el.style.height = rand(10, 22) + 'px';
        layer.appendChild(el);
      }
      for (let i = 0; i < 15; i++) {
        const el = document.createElement('span');
        el.className = 'party-balloon';
        el.style.left = rand(3, 96) + 'vw';
        el.style.setProperty('--balloon', pick(['#c82333', '#244678', '#d3a347', '#fff4c4', '#6ed3e7']));
        el.style.setProperty('--drift', rand(-80, 80) + 'px');
        el.style.animationDuration = rand(4.2, 6.4) + 's';
        el.style.animationDelay = rand(0, 1.1) + 's';
        layer.appendChild(el);
      }
      clearLayerLater();
    }
    showPop('cooneyActivatedImagePop');
    if (typeof window.deeMakeEmojiRain === 'function') window.deeMakeEmojiRain('activate');
  }

  function deactivationEffects() {
    const layer = partyLayer();
    const loserBits = ['💩', '😒', '🧦', '🥱', '👎', '🚫', '😭', '🧻', '☔', '💤', '🤡'];
    if (layer) {
      layer.innerHTML = '';
      for (let i = 0; i < 80; i++) {
        const el = document.createElement('span');
        el.className = 'loser-piece';
        el.textContent = pick(loserBits);
        el.style.left = rand(0, 100) + 'vw';
        el.style.animationDuration = rand(2.1, 4.6) + 's';
        el.style.animationDelay = rand(0, .8) + 's';
        layer.appendChild(el);
      }
      for (let i = 0; i < 8; i++) {
        const c = document.createElement('span');
        c.className = 'gray-cloud';
        c.style.left = rand(4, 86) + 'vw';
        c.style.top = rand(-8, 18) + 'vh';
        c.style.setProperty('--drift', rand(-80, 80) + 'px');
        c.style.animationDelay = rand(0, .7) + 's';
        layer.appendChild(c);
      }
      clearLayerLater();
    }
    showPop('cooneyDeactivatedImagePop');
    if (typeof window.deeMakeEmojiRain === 'function') window.deeMakeEmojiRain('deactivate');
  }

  function updateMusicBar(trackPath, label) {
    const bar = document.getElementById('cooneyMusicbar');
    if (!bar) return;
    bar.style.display = 'flex';
    const track = bar.querySelector('.cooney-track');
    const file = (trackPath || '').split('/').pop() || trackPath || '';
    if (track) {
      track.innerHTML = '<strong>Now Playing: ' + esc(label || 'Vacation Mode') + '</strong><span>' + esc(file) + '</span>';
    }
    const pp = document.getElementById('cooneyPlayPause');
    if (pp) pp.textContent = 'Pause';
  }

  function syncButtons(active) {
    qsa('#activateVacationMode').forEach(function (btn) {
      if (IS_HOME) {
        btn.className = 'cooney-vacation-button' + (active ? ' deactivate' : '');
        btn.innerHTML = active ? '<span>💩 🛑 Deactivate Vacation Mode (Loser)</span>' : '<span>🎉 Activate Vacation Mode</span>';
      } else {
        btn.className = 'cooney-vacation-button' + (active ? ' deactivate' : '');
        btn.innerHTML = active ? '<span>💩 🛑 Deactivate Vacation Mode (Loser)</span>' : '<span>🌦️ Weather Vacation Mode</span>';
      }
    });
    const pp = document.getElementById('cooneyPlayPause');
    if (pp) pp.textContent = active ? 'Pause' : 'Play';
  }


  function hideDestinationLandingOverlay() {
    if (!IS_DESTINATION) return;
    document.body.classList.remove('prelaunch');
    document.body.classList.add('vacation-entered', 'cooney-destination-ready');
    const overlay = document.getElementById('cooneyStartOverlay');
    if (overlay) {
      overlay.classList.add('dismissed');
      overlay.setAttribute('hidden', '');
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  }

  function unlockHomeLauncher() {
    document.body.classList.remove('prelaunch');
    document.body.classList.add('vacation-entered');
    const overlay = document.getElementById('cooneyStartOverlay');
    if (overlay) {
      overlay.classList.add('dismissed');
      overlay.setAttribute('hidden', '');
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
    }
    try { localStorage.setItem('cooneyCelebrationSeen', 'yes'); } catch (err) {}
  }

  async function activateHomeLanding() {
    launchModeActive = true;
    weatherModeActive = false;
    try {
      localStorage.setItem('cooneyLaunchAnthemActive', 'active');
      localStorage.setItem('cooneyWeatherModeActive', 'inactive');
      localStorage.setItem('cooneyVacationMode', 'active');
    } catch (err) {}
    unlockHomeLauncher();
    syncButtons(true);
    await playTrack(LAUNCH_SONG, { label: 'Vacation Launch Anthem', volume: 0.86 });
    activationEffects();
  }

  function deactivateAnyMode() {
    try {
      localStorage.setItem('cooneyLaunchAnthemActive', 'inactive');
      localStorage.setItem('cooneyWeatherModeActive', 'inactive');
      localStorage.setItem('cooneyVacationMode', 'inactive');
      sessionStorage.removeItem('cooney-carry-perfect');
      sessionStorage.removeItem('cooney-carry-perfect-time');
    } catch (err) {}
    stopAllAudio();
    syncButtons(false);
    deactivationEffects();
  }

  function installDestinationCarryLinks() {
    qsa('a[href]').forEach(function (a) {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const isDestination = href.indexOf('cape_may.html') >= 0 || href.indexOf('avalon.html') >= 0 || href.indexOf('atlantic_city.html') >= 0;
      if (!isDestination) return;
      a.addEventListener('click', function () {
        const audio = getAudio();
        const src = audio.currentSrc || audio.src || '';
        const launchActive = localStorage.getItem('cooneyLaunchAnthemActive') === 'active' || sameFile(src, LAUNCH_SONG);
        if (launchActive) {
          try {
            sessionStorage.setItem('cooney-carry-perfect', 'yes');
            sessionStorage.setItem('cooney-carry-perfect-time', String(audio.currentTime || 0));
          } catch (err) {}
        }
      }, true);
    });
  }

  async function resumeLaunchAnthemIfNeeded() {
    if (!IS_DESTINATION) return;
    hideDestinationLandingOverlay();
    syncButtons(false);
    const shouldCarry = sessionStorage.getItem('cooney-carry-perfect') === 'yes' || localStorage.getItem('cooneyLaunchAnthemActive') === 'active';
    if (!shouldCarry) return;
    const t = Number(sessionStorage.getItem('cooney-carry-perfect-time') || 0);
    launchModeActive = true;
    weatherModeActive = false;
    await playTrack(LAUNCH_SONG, { label: 'Vacation Launch Anthem', startSeconds: t, volume: 0.86 });
    syncButtons(false);
  }

  function codeLabel(code) {
    const c = Number(code);
    if ([95, 96, 99].indexOf(c) >= 0) return 'Storms';
    if ([61, 63, 65, 66, 67, 80, 81, 82].indexOf(c) >= 0) return 'Rain';
    if ([51, 53, 55, 56, 57].indexOf(c) >= 0) return 'Drizzle';
    if ([71, 73, 75, 77, 85, 86].indexOf(c) >= 0) return 'Snow';
    if ([45, 48].indexOf(c) >= 0) return 'Fog';
    if ([1, 2, 3].indexOf(c) >= 0) return c === 3 ? 'Cloudy' : 'Partly Cloudy';
    return 'Clear';
  }

  function moodForPeriod(p) {
    const code = Number(p.code || 0);
    const temp = Number(p.tempF || 0);
    const precip = Number(p.precip || 0);
    const wind = Number(p.wind || 0);
    const cloud = Number(p.cloud || 0);
    if ([95, 96, 99].indexOf(code) >= 0) return 'storm';
    if ([61, 63, 65, 66, 67, 80, 81, 82, 51, 53, 55, 56, 57].indexOf(code) >= 0 || precip >= 45) return 'rain';
    if (temp < COLD_BELOW_F) return 'cold';
    if (temp >= 88) return 'hot';
    if (wind >= 22) return 'windy';
    if (cloud >= 70 || code === 3) return 'cloudy';
    return 'perfect';
  }

  function overallMood(periods) {
    const moods = periods.map(moodForPeriod);
    if (moods.indexOf('storm') >= 0) return 'storm';
    if (moods.indexOf('rain') >= 0) return 'rain';
    if (moods.indexOf('cold') >= 0) return 'cold';
    if (moods.indexOf('hot') >= 0) return 'hot';
    if (moods.indexOf('windy') >= 0) return 'windy';
    if (moods.indexOf('cloudy') >= 0) return 'cloudy';
    return 'perfect';
  }

  function severity(code) {
    if ([95, 96, 99].indexOf(code) >= 0) return 100;
    if ([80, 81, 82, 61, 63, 65, 66, 67].indexOf(code) >= 0) return 80;
    if ([51, 53, 55, 56, 57].indexOf(code) >= 0) return 60;
    if ([45, 48].indexOf(code) >= 0) return 40;
    if (code === 3) return 30;
    if ([1, 2].indexOf(code) >= 0) return 20;
    return 10;
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

  function periodFromHourly(hourly, dateISO, name, startHour, endHour) {
    const rows = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const t = hourly.time[i];
      if (!t || t.indexOf(dateISO + 'T') !== 0) continue;
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

  async function fetchWeatherData() {
    if (weatherCache) return weatherCache;
    if (weatherPromise) return weatherPromise;
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + encodeURIComponent(LOCATION.lat)
      + '&longitude=' + encodeURIComponent(LOCATION.lon)
      + '&hourly=temperature_2m,precipitation_probability,weather_code,cloud_cover,wind_speed_10m'
      + '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'
      + '&forecast_days=3&timezone=auto';
    weatherPromise = fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('Weather fetch failed: ' + res.status);
      return res.json();
    }).then(function (data) {
      const d = todayTomorrowDates();
      const periods = [
        periodFromHourly(data.hourly, d.today, 'Today Morning', 6, 11),
        periodFromHourly(data.hourly, d.today, 'Today Afternoon', 12, 17),
        periodFromHourly(data.hourly, d.today, 'Today Night', 18, 23),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Morning', 6, 11),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Afternoon', 12, 17),
        periodFromHourly(data.hourly, d.tomorrow, 'Tomorrow Night', 18, 23)
      ];
      weatherCache = { periods: periods, mood: overallMood(periods) };
      return weatherCache;
    }).catch(function (err) {
      console.warn('Cooney weather fallback:', err);
      weatherCache = {
        periods: [{ name: 'Weather', tempF: 72, precip: 0, wind: 0, cloud: 0, code: 0, condition: 'Forecast Loading', mood: 'perfect' }],
        mood: 'perfect'
      };
      return weatherCache;
    });
    return weatherPromise;
  }

  function quipForMood(mood) {
    const list = (CFG.quips && CFG.quips[mood]) || (CFG.quips && CFG.quips.perfect) || ['Vacation weather has entered the chat.'];
    return pick(list);
  }

  function showWeatherOverlay(periods, mood, track) {
    if (!IS_DESTINATION) return;
    injectControllerStyles();
    const old = document.getElementById('cooneyWeatherOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cooneyWeatherOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'cooney-weather-card';
    card.addEventListener('click', function (e) { e.stopPropagation(); });

    const grid = periods.map(function (p) {
      return '<div class="cooney-weather-period">'
        + '<b>' + esc(p.name) + '</b>'
        + '<span>' + esc(p.condition) + ' • ' + esc(p.tempF) + '°F</span>'
        + '<span>Rain ' + esc(p.precip) + '% • Wind ' + esc(p.wind) + ' mph</span>'
        + '</div>';
    }).join('');

    card.innerHTML = '<div class="cooney-weather-kicker">' + esc(LOCATION.place) + '</div>'
      + '<h2 class="cooney-weather-title">Weather Vacation Mode</h2>'
      + '<div class="cooney-weather-quip">' + esc(quipForMood(mood)) + '</div>'
      + '<div class="cooney-weather-grid">' + grid + '</div>'
      + '<div class="cooney-weather-trackline">🎵 Loaded <b>' + esc(mood.toUpperCase()) + '</b> mode • ' + esc((track || '').split('/').pop()) + '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function () { overlay.remove(); });
  }

  async function activateWeatherMode() {
    hideDestinationLandingOverlay();
    syncButtons(false);
    const data = await fetchWeatherData();
    const mood = data.mood || 'perfect';
    const track = pickTrackNoRepeat(mood);
    try {
      localStorage.setItem('cooneyLaunchAnthemActive', 'inactive');
      localStorage.setItem('cooneyWeatherModeActive', 'active');
      localStorage.setItem('cooneyVacationMode', 'active');
      sessionStorage.removeItem('cooney-carry-perfect');
      sessionStorage.removeItem('cooney-carry-perfect-time');
    } catch (err) {}
    launchModeActive = false;
    weatherModeActive = true;
    await playTrack(track, { label: 'Weather Vacation Mode — ' + mood.toUpperCase(), volume: 0.86 });
    activationEffects();
    showWeatherOverlay(data.periods, mood, track);
    syncButtons(true);
  }

  function installButtonCapture() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest && e.target.closest('#activateVacationMode, #cooneyOverlayActivate');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (IS_HOME) {
        if (launchModeActive || localStorage.getItem('cooneyLaunchAnthemActive') === 'active') deactivateAnyMode();
        else activateHomeLanding();
      } else {
        if (weatherModeActive || localStorage.getItem('cooneyWeatherModeActive') === 'active') deactivateAnyMode();
        else activateWeatherMode();
      }
    }, true);

    const playPause = document.getElementById('cooneyPlayPause');
    if (playPause) {
      playPause.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const audio = getAudio();
        if (!audio.paused) {
          audio.pause();
          playPause.textContent = 'Play';
        } else {
          const fallbackTrack = IS_HOME ? LAUNCH_SONG : (localStorage.getItem('cooney-selected-weather-track') || LAUNCH_SONG);
          playTrack(fallbackTrack, { label: IS_HOME ? 'Vacation Launch Anthem' : 'Weather Vacation Mode' });
          playPause.textContent = 'Pause';
        }
      }, true);
    }
  }

  function installLinkRules() {
    qsa('a[href$=".html"]').forEach(function (a) { a.removeAttribute('target'); a.removeAttribute('rel'); });
    qsa('a[href$=".pdf"]').forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
  }

  function init() {
    injectControllerStyles();
    installButtonCapture();
    installDestinationCarryLinks();
    installLinkRules();
    setTimeout(installLinkRules, 500);

    if (IS_HOME) {
      launchModeActive = localStorage.getItem('cooneyLaunchAnthemActive') === 'active';
      weatherModeActive = false;
      syncButtons(launchModeActive);
    } else {
      hideDestinationLandingOverlay();
      weatherModeActive = false;
      syncButtons(false);
      resumeLaunchAnthemIfNeeded();
      // Prefetch only. Do NOT show the overlay or change music until the user taps Weather Vacation Mode.
      fetchWeatherData();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.COONEY_PICK_WEATHER_TRACK = pickTrackNoRepeat;
  window.COONEY_STOP_VACATION_MUSIC = deactivateAnyMode;
  window.COONEY_PLAY_SELECTED_WEATHER_TRACK = function () {
    return IS_HOME ? activateHomeLanding() : activateWeatherMode();
  };
})();
