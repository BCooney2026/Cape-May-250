/* Cooney Jersey Shore Vacation Mode Controller
   v39 landing-page-safe repair.
   Scope: assets/js/cooney-weather-overlay.js only.
   Does not touch assets/audio. Designed to survive missing listed audio files.
   Critical: homepage click is NOT captured or stopped, so the existing landing-page launch behavior can still run.
*/
(function () {
  'use strict';

  if (window.__COONEY_VACATION_CONTROLLER_V39__) return;
  window.__COONEY_VACATION_CONTROLLER_V39__ = true;

  var ACTIVE_CLASS = 'cooney-vacation-active';
  var BUTTON_SELECTOR = '#activateVacationMode, [data-cooney-vacation-button]';
  var AUDIO_SELECTOR = '#cooneyVacationAudio, #vacationAudio, audio[data-cooney-audio], audio';
  var DEFAULT_LANDING_TRACK = 'assets/audio/perfect-1.m4a';
  var DEFAULT_WEATHER_FALLBACKS = [
    'assets/audio/sunny-1.m4a',
    'assets/audio/perfect-1.m4a'
  ];

  var state = {
    active: false,
    currentTrack: '',
    currentMode: '',
    handlerAttached: false,
    lastWeatherCategory: '',
    lastError: null
  };

  function log() {
    try {
      if (window.COONEY_DEBUG_AUDIO) console.log.apply(console, ['[CooneyVacation]'].concat([].slice.call(arguments)));
    } catch (_) {}
  }

  function fire(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function getConfig() {
    return window.COONEY_VACATION_CONFIG || window.vacationConfig || window.COONEY_CONFIG || {};
  }

  function normalizePath(path) {
    if (!path) return '';
    if (typeof path === 'object') {
      path = path.src || path.url || path.file || path.path || path.track || '';
    }
    path = String(path).trim();
    if (!path) return '';
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    path = path.replace(/^\.\//, '');
    if (path.indexOf('assets/audio/') === 0) return path;
    if (path.indexOf('/assets/audio/') === 0) return path.replace(/^\//, '');
    if (/\.(m4a|mp3|wav|ogg|aac)$/i.test(path)) return 'assets/audio/' + path.replace(/^audio\//, '').replace(/^assets\/audio\//, '');
    return path;
  }

  function unique(arr) {
    var seen = Object.create(null);
    return (arr || []).map(normalizePath).filter(function (x) {
      if (!x || seen[x]) return false;
      seen[x] = true;
      return true;
    });
  }

  function flattenTracks(value) {
    var out = [];
    if (!value) return out;
    if (Array.isArray(value)) {
      value.forEach(function (item) { out = out.concat(flattenTracks(item)); });
      return out;
    }
    if (typeof value === 'object') {
      if (value.src || value.url || value.file || value.path || value.track) out.push(value);
      Object.keys(value).forEach(function (key) {
        if (key !== 'src' && key !== 'url' && key !== 'file' && key !== 'path' && key !== 'track') {
          out = out.concat(flattenTracks(value[key]));
        }
      });
      return out;
    }
    out.push(value);
    return out;
  }

  function getAudio() {
    var audio = document.querySelector(AUDIO_SELECTOR);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'cooneyVacationAudio';
      audio.preload = 'auto';
      audio.setAttribute('data-cooney-audio', 'true');
      document.body.appendChild(audio);
    }
    audio.loop = false;
    window.COONEY_AUDIO = audio;
    return audio;
  }

  function getButton() {
    return document.querySelector(BUTTON_SELECTOR);
  }

  function isHomePage() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (document.body && document.body.dataset && document.body.dataset.cooneyPage === 'home') return true;
    if (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.cooneyPage === 'home') return true;
    return file === '' || file === 'index.html';
  }

  function setButtonActive(button, active) {
    if (!button) return;
    button.dataset.cooneyVacationActive = active ? 'true' : 'false';
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle(ACTIVE_CLASS, !!active);
    var offText = button.dataset.deactivateText || '⏹ DEACTIVATE VACATION MODE';
    var homeOnText = button.dataset.activateText || '🎉 ACTIVATE VACATION MODE';
    var weatherOnText = button.dataset.weatherText || '🌦️ WEATHER VACATION MODE';
    button.textContent = active ? offText : (isHomePage() ? homeOnText : weatherOnText);
  }

  function showActivated(detail) {
    try {
      if (typeof window.cooneyShowActivatedOverlayImage === 'function') {
        window.cooneyShowActivatedOverlayImage(detail || {});
      }
    } catch (err) { state.lastError = err; }
  }

  function showDeactivated(detail) {
    try {
      if (typeof window.cooneyShowDeactivatedOverlayImage === 'function') {
        window.cooneyShowDeactivatedOverlayImage(detail || {});
      }
    } catch (err) { state.lastError = err; }
  }

  function ensureWeatherOverlay(detail) {
    detail = detail || {};
    var overlayFnNames = [
      'cooneyShowWeatherOverlay',
      'cooneyShowWeatherVacationOverlay',
      'COONEY_SHOW_WEATHER_OVERLAY'
    ];
    for (var i = 0; i < overlayFnNames.length; i++) {
      var fn = window[overlayFnNames[i]];
      if (typeof fn === 'function') {
        try { fn(detail); } catch (err) { state.lastError = err; }
        fire('cooney:weather-overlay-called', detail);
        return;
      }
    }

    var overlay = document.getElementById('cooneyWeatherOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cooneyWeatherOverlay';
      overlay.className = 'cooney-weather-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-live', 'polite');
      overlay.innerHTML = '<div class="cooney-weather-card"><button type="button" class="cooney-weather-dismiss" aria-label="Dismiss weather overlay">×</button><div class="cooney-weather-title">Weather Vacation Mode</div><div class="cooney-weather-message"></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('.cooney-weather-dismiss').addEventListener('click', function () {
        overlay.classList.remove('is-visible');
        overlay.hidden = true;
        fire('cooney:weather-overlay-dismissed', { audioContinues: state.active });
      });
    }
    var msg = overlay.querySelector('.cooney-weather-message');
    if (msg) msg.textContent = detail.category ? ('Playing ' + detail.category + ' vacation music.') : 'Vacation music is rolling.';
    overlay.hidden = false;
    overlay.classList.add('is-visible');
    fire('cooney:weather-overlay-called', detail);
  }

  function getLandingTracks() {
    var cfg = getConfig();
    return unique(flattenTracks(
      cfg.landingSongs || cfg.homeSongs || cfg.activateSongs || cfg.vacationSongs || cfg.landingTrack || cfg.homeTrack || DEFAULT_LANDING_TRACK
    )).concat([DEFAULT_LANDING_TRACK]);
  }

  function weatherBucketFromText(text) {
    text = String(text || '').toLowerCase();
    if (/thunder|storm|lightning/.test(text)) return 'stormy';
    if (/rain|shower|drizzle|wet/.test(text)) return 'rainy';
    if (/wind|gust|breeze/.test(text)) return 'windy';
    if (/cloud|overcast|fog|mist/.test(text)) return 'cloudy';
    if (/snow|ice|sleet/.test(text)) return 'cold';
    if (/hot|heat|humid/.test(text)) return 'hot';
    if (/sun|clear|fair|perfect/.test(text)) return 'sunny';
    return 'perfect';
  }

  function readForecastText() {
    var cfg = getConfig();
    var candidates = [
      cfg.currentWeather,
      cfg.weatherSummary,
      cfg.forecast,
      window.COONEY_CURRENT_WEATHER,
      window.COONEY_WEATHER_SUMMARY
    ];
    var nodes = document.querySelectorAll('[data-weather-summary], .weather-summary, #weatherSummary, #currentWeather');
    nodes.forEach(function (node) { candidates.push(node.textContent || ''); });
    return candidates.filter(Boolean).join(' ');
  }

  function getWeatherSongsForCategory(category) {
    var cfg = getConfig();
    var ws = cfg.weatherSongs || cfg.weather_tracks || cfg.weatherTracks || {};
    var keys = [category, category + 'Songs', category + 'Music'];
    var list = [];
    keys.forEach(function (key) { if (ws && ws[key]) list = list.concat(flattenTracks(ws[key])); });
    if (!list.length && ws && typeof ws === 'object') list = flattenTracks(ws);
    if (!list.length) list = DEFAULT_WEATHER_FALLBACKS;
    return unique(list.concat(DEFAULT_WEATHER_FALLBACKS));
  }

  function chooseRandom(list) {
    list = list || [];
    return list[Math.floor(Math.random() * list.length)] || '';
  }

  function canFetch(url) {
    if (!window.fetch) return Promise.resolve(true);
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (response) { return response && response.ok; })
      .catch(function () { return false; });
  }

  function tryPlayCandidates(candidates, detail) {
    candidates = unique(candidates);
    var audio = getAudio();
    var index = 0;

    function attempt() {
      var track = candidates[index++];
      if (!track) {
        state.lastError = new Error('No playable vacation audio track found.');
        fire('cooney:audio-failed', { candidates: candidates, error: String(state.lastError) });
        return Promise.reject(state.lastError);
      }

      return canFetch(track).then(function (ok) {
        if (!ok) {
          fire('cooney:audio-missing-skipped', { src: track });
          return attempt();
        }
        audio.src = track;
        audio.currentTime = 0;
        state.currentTrack = track;
        fire('cooney:audio-src-set', { src: track, detail: detail || {} });
        var playResult;
        try {
          playResult = audio.play();
        } catch (err) {
          state.lastError = err;
          fire('cooney:audio-play-error', { src: track, error: String(err) });
          return attempt();
        }
        return Promise.resolve(playResult).then(function () {
          fire('cooney:audio-play-called', { src: track, detail: detail || {} });
          return track;
        }).catch(function (err) {
          state.lastError = err;
          fire('cooney:audio-play-error', { src: track, error: String(err) });
          return attempt();
        });
      });
    }

    return attempt();
  }

  function activateHome(button) {
    var candidates = unique(getLandingTracks());
    state.currentMode = 'home';
    fire('cooney:controller-run', { mode: 'home', candidates: candidates });
    return tryPlayCandidates(candidates, { mode: 'home' }).then(function (track) {
      state.active = true;
      setButtonActive(button, true);
      showActivated({ mode: 'home', src: track });
      fire('cooney:activated', { mode: 'home', src: track });
      return track;
    });
  }

  function pickWeatherTrack() {
    var category = weatherBucketFromText(readForecastText());
    state.lastWeatherCategory = category;
    var songs = getWeatherSongsForCategory(category);
    var track = chooseRandom(songs);
    return { category: category, track: track, candidates: unique([track].concat(songs)) };
  }

  function playSelectedWeatherTrack(selection, button) {
    selection = selection || pickWeatherTrack();
    state.currentMode = 'weather';
    fire('cooney:controller-run', { mode: 'weather', category: selection.category, candidates: selection.candidates });
    ensureWeatherOverlay(selection);
    return tryPlayCandidates(selection.candidates, { mode: 'weather', category: selection.category }).then(function (track) {
      state.active = true;
      setButtonActive(button || getButton(), true);
      showActivated({ mode: 'weather', category: selection.category, src: track });
      fire('cooney:activated', { mode: 'weather', category: selection.category, src: track });
      return track;
    });
  }

  function stopVacationMusic() {
    var audio = getAudio();
    try { audio.pause(); } catch (_) {}
    try { audio.currentTime = 0; } catch (_) {}
    try { audio.removeAttribute('src'); audio.load(); } catch (_) {}
    state.active = false;
    state.currentTrack = '';
    setButtonActive(getButton(), false);
    showDeactivated({ mode: state.currentMode || 'vacation' });
    fire('cooney:deactivated', { mode: state.currentMode || 'vacation' });
  }

  function handleClick(event) {
    var button = event.target && event.target.closest ? event.target.closest(BUTTON_SELECTOR) : null;
    if (!button) return;
    var home = isHomePage();

    // Homepage safety rule:
    // Do not preventDefault/stopPropagation on the landing page.
    // The homepage has its own launch/enter behavior, and the vacation music controller
    // must ride alongside that behavior instead of hijacking the click.
    if (!home) {
      event.preventDefault();
    }

    fire('cooney:raw-click-detected', { text: button.textContent || '', active: state.active, home: home });

    var buttonSaysDeactivate = /deactivate|stop|pause/i.test(button.textContent || '');
    if (state.active || button.dataset.cooneyVacationActive === 'true' || buttonSaysDeactivate) {
      stopVacationMusic();
      return;
    }

    var promise = home ? activateHome(button) : playSelectedWeatherTrack(pickWeatherTrack(), button);
    Promise.resolve(promise).catch(function (err) {
      state.lastError = err;
      log('activation failed', err);
      setButtonActive(button, false);
      fire('cooney:activation-error', { error: String(err) });
    });
  }

  function attach() {
    getAudio();
    var button = getButton();
    if (button) setButtonActive(button, false);
    if (!state.handlerAttached) {
      document.addEventListener('click', handleClick, false);
      state.handlerAttached = true;
    }
    fire('cooney:controller-ready', { buttonExists: !!button, audioExists: !!document.querySelector(AUDIO_SELECTOR) });
  }

  window.COONEY_PICK_WEATHER_TRACK = pickWeatherTrack;
  window.COONEY_PLAY_SELECTED_WEATHER_TRACK = function (selection) { return playSelectedWeatherTrack(selection, getButton()); };
  window.COONEY_STOP_VACATION_MUSIC = stopVacationMusic;
  window.COONEY_VACATION_STATE = state;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();
