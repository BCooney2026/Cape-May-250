/* Cooney Weather Overlay + Vacation Audio Controller - v24
   SAFE PATCH: This script never writes to /assets/audio/ and never creates audio files.
   Audio folder rule: keep your uploaded files in /assets/audio/ exactly as-is.

   What this script does:
   - Shows the funny weather overlay.
   - Picks a weather mood: hot / rain / windy / perfect / cloudy / storm / cold.
   - Randomly picks from however many tracks are listed for that mood.
   - Does not repeat the same track back-to-back when another option exists.
   - Uses ONE global audio player on the page.
   - Activate starts/replaces exactly one song.
   - Deactivate stops all music.
   - Cleans up old/duplicate audio players so songs cannot stack.
*/
(function () {
  "use strict";

  const CONFIG = window.COONEY_VACATION_CONFIG || {};
  const PERIODS = [
    { key: "morning", label: "Morning", start: 6, end: 12, emoji: "☕" },
    { key: "afternoon", label: "Afternoon", start: 12, end: 18, emoji: "🌞" },
    { key: "night", label: "Night", start: 18, end: 24, emoji: "🌙" }
  ];

  const AUDIO_ID = "cooneyVacationAudioSingleton";
  const BUTTON_SELECTORS = [
    "#activateVacationMode",
    "#vacationModeButton",
    ".activateVacationMode",
    ".vacation-mode-button",
    "[data-vacation-mode-button]"
  ];

  window.COONEY_VACATION_MODE_ON = false;
  window.COONEY_SELECTED_WEATHER_SONG = window.COONEY_SELECTED_WEATHER_SONG || null;
  window.COONEY_SELECTED_WEATHER_MOOD = window.COONEY_SELECTED_WEATHER_MOOD || (CONFIG.defaultMood || "perfect");

  function pageKey() {
    const last = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    return last || "index.html";
  }

  function getLocationConfig() {
    const locs = CONFIG.locations || {};
    return locs[pageKey()] || locs["index.html"] || { name: "Jersey Shore", latitude: 39.1012, longitude: -74.7177 };
  }

  function pick(arr) {
    return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : "";
  }

  function codeMeansRain(code) {
    return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(Number(code));
  }

  function codeMeansStorm(code) {
    return [95, 96, 99].includes(Number(code));
  }

  function codeMeansCloudy(code) {
    return [2, 3, 45, 48].includes(Number(code));
  }

  function classifyMood(slot) {
    const temp = Number.isFinite(slot.temp) ? slot.temp : 72;
    const rain = Number.isFinite(slot.rain) ? slot.rain : 0;
    const wind = Number.isFinite(slot.wind) ? slot.wind : 0;
    const cloud = Number.isFinite(slot.cloud) ? slot.cloud : 0;
    const code = Number.isFinite(slot.code) ? slot.code : 0;

    const coldBelowF = Number(CONFIG.coldBelowF ?? 60);
    const hotAtOrAboveF = Number(CONFIG.hotAtOrAboveF ?? 86);
    const rainChanceAtOrAbove = Number(CONFIG.rainChanceAtOrAbove ?? 45);
    const stormChanceAtOrAbove = Number(CONFIG.stormChanceAtOrAbove ?? 70);
    const windyAtOrAboveMph = Number(CONFIG.windyAtOrAboveMph ?? 22);
    const cloudyAtOrAbovePercent = Number(CONFIG.cloudyAtOrAbovePercent ?? 72);

    if (codeMeansStorm(code) || rain >= stormChanceAtOrAbove) return "storm";
    if (codeMeansRain(code) || rain >= rainChanceAtOrAbove) return "rain";
    if (temp >= hotAtOrAboveF) return "hot";
    if (temp < coldBelowF) return "cold";
    if (wind >= windyAtOrAboveMph) return "windy";
    if (codeMeansCloudy(code) || cloud >= cloudyAtOrAbovePercent) return "cloudy";
    return "perfect";
  }

  function weatherLabel(code) {
    code = Number(code);
    if (codeMeansStorm(code)) return "Stormy";
    if (codeMeansRain(code)) return "Rainy";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([2, 3].includes(code)) return "Cloudy";
    if (code === 1) return "Mostly clear";
    return "Clear";
  }

  function avg(nums) {
    const clean = nums.filter(Number.isFinite);
    return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
  }

  function max(nums) {
    const clean = nums.filter(Number.isFinite);
    return clean.length ? Math.max(...clean) : null;
  }

  function mostCommon(nums) {
    const counts = new Map();
    nums.filter(n => n !== null && n !== undefined && !Number.isNaN(n)).forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
    let best = null;
    let bestCount = -1;
    counts.forEach((count, val) => {
      if (count > bestCount) {
        best = val;
        bestCount = count;
      }
    });
    return best ?? 0;
  }

  function fmtDate(d) {
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }

  function summarize(data) {
    const h = data.hourly || {};
    const rows = (h.time || []).map((t, i) => ({
      date: new Date(t),
      temp: Number(h.temperature_2m?.[i]),
      rain: Number(h.precipitation_probability?.[i]),
      wind: Number(h.wind_speed_10m?.[i]),
      cloud: Number(h.cloud_cover?.[i]),
      code: Number(h.weather_code?.[i])
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dates = [today, tomorrow];
    const out = [];

    dates.forEach(day => {
      PERIODS.forEach(period => {
        const periodRows = rows.filter(r => {
          const rd = new Date(r.date);
          rd.setHours(0, 0, 0, 0);
          const hour = r.date.getHours();
          return rd.getTime() === day.getTime() && hour >= period.start && hour < period.end;
        });
        if (!periodRows.length) return;
        const slot = {
          day: fmtDate(day),
          period: period.label,
          emoji: period.emoji,
          temp: Math.round(avg(periodRows.map(r => r.temp)) ?? 0),
          rain: Math.round(max(periodRows.map(r => r.rain)) ?? 0),
          wind: Math.round(avg(periodRows.map(r => r.wind)) ?? 0),
          cloud: Math.round(avg(periodRows.map(r => r.cloud)) ?? 0),
          code: mostCommon(periodRows.map(r => r.code))
        };
        slot.mood = classifyMood(slot);
        slot.condition = weatherLabel(slot.code);
        out.push(slot);
      });
    });

    return out.slice(0, 6);
  }

  function getAllAudioElements() {
    return Array.from(document.querySelectorAll("audio"));
  }

  function getSingletonAudio() {
    let audio = document.getElementById(AUDIO_ID);
    if (!audio) {
      audio = new Audio();
      audio.id = AUDIO_ID;
      audio.loop = true;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "");
      audio.style.display = "none";
      document.body.appendChild(audio);
    }
    audio.loop = true;
    window.COONEY_AUDIO = audio;
    return audio;
  }

  function stopAudioElement(audio) {
    if (!audio) return;
    try { audio.pause(); } catch (e) {}
    try { audio.currentTime = 0; } catch (e) {}
  }

  function stopAllAudioExcept(exceptAudio) {
    getAllAudioElements().forEach(audio => {
      if (audio !== exceptAudio) stopAudioElement(audio);
    });
  }

  function stopAllVacationAudio() {
    getAllAudioElements().forEach(stopAudioElement);
    if (window.COONEY_AUDIO) stopAudioElement(window.COONEY_AUDIO);
    window.COONEY_VACATION_MODE_ON = false;
    setVacationButtonState(false);
  }

  function normalizeTrack(track, mood, bucket) {
    const base = CONFIG.audioBasePath || "assets/audio/";
    const safeTrack = track || {};
    const file = safeTrack.file || bucket?.file || "perfect-1.m4a";
    return {
      mood,
      label: bucket?.label || mood,
      file,
      title: safeTrack.title || safeTrack.example || bucket?.label || mood,
      artist: safeTrack.artist || "",
      src: base + file
    };
  }

  function songForMood(mood) {
    const songs = CONFIG.weatherSongs || {};
    const defaultMood = CONFIG.defaultMood || "perfect";
    const bucket = songs[mood] || songs[defaultMood] || { label: "Perfect Vacation Mode", tracks: [{ file: "perfect-1.m4a" }] };
    let candidates = Array.isArray(bucket.tracks) && bucket.tracks.length ? bucket.tracks.slice() : [{ file: bucket.file || "perfect-1.m4a" }];

    const lastKey = "cooneyLastWeatherSong_" + mood;
    let lastFile = "";
    try { lastFile = localStorage.getItem(lastKey) || ""; } catch (e) {}

    if (candidates.length > 1) {
      const filtered = candidates.filter(track => track.file !== lastFile);
      if (filtered.length) candidates = filtered;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
    try { localStorage.setItem(lastKey, chosen.file || ""); } catch (e) {}

    return normalizeTrack(chosen, mood, bucket);
  }

  function setSelectedWeatherSong(song) {
    if (!song || !song.src) return;
    window.COONEY_SELECTED_WEATHER_SONG = song;
    window.COONEY_SELECTED_WEATHER_MOOD = song.mood || CONFIG.defaultMood || "perfect";
    try { localStorage.setItem("cooneySelectedWeatherSong", JSON.stringify(song)); } catch (e) {}
  }

  function getSelectedSongOrPick() {
    if (window.COONEY_SELECTED_WEATHER_SONG && window.COONEY_SELECTED_WEATHER_SONG.src) {
      return window.COONEY_SELECTED_WEATHER_SONG;
    }
    const mood = window.COONEY_SELECTED_WEATHER_MOOD || CONFIG.defaultMood || "perfect";
    const song = songForMood(mood);
    setSelectedWeatherSong(song);
    return song;
  }

  function startVacationAudio(song) {
    const chosen = song && song.src ? song : getSelectedSongOrPick();
    const audio = getSingletonAudio();

    // First kill everything else, including old Cape/homepage audio tags.
    stopAllAudioExcept(audio);

    const currentSrc = audio.getAttribute("src") || "";
    const needsNewSource = !currentSrc || !currentSrc.endsWith(chosen.file);
    if (needsNewSource) {
      stopAudioElement(audio);
      audio.setAttribute("src", chosen.src);
      try { audio.load(); } catch (e) {}
    }

    audio.loop = true;
    audio.volume = 0.85;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(err => console.warn("Vacation music could not start:", err));
    }

    window.COONEY_VACATION_MODE_ON = true;
    setVacationButtonState(true);
    return chosen;
  }

  function setVacationButtonState(isOn) {
    const btn = findVacationButton();
    if (!btn) return;
    btn.classList.toggle("vacation-mode-active", !!isOn);
    btn.classList.toggle("active", !!isOn);
    btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    const text = isOn ? "Deactivate Vacation Mode" : "Activate Vacation Mode";
    if (btn.tagName === "INPUT") btn.value = text;
    else btn.textContent = text;
  }

  function findVacationButton() {
    for (const selector of BUTTON_SELECTORS) {
      const found = document.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  function unlockLandingIfPresent() {
    document.documentElement.classList.remove("prelaunch", "landing-locked", "vacation-locked");
    document.body.classList.remove("prelaunch", "landing-locked", "vacation-locked");

    const possibleLandingSelectors = [
      "#landingOverlay",
      "#prelaunchOverlay",
      "#vacationLanding",
      ".landing-overlay",
      ".prelaunch-overlay",
      ".vacation-landing",
      ".start-screen"
    ];

    possibleLandingSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add("dismissed", "hidden");
        el.style.pointerEvents = "none";
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        setTimeout(() => {
          if (el && el.parentNode && (el.classList.contains("prelaunch-overlay") || el.id === "prelaunchOverlay")) {
            // Keep it harmless even if the page expects the element to exist.
            el.style.display = "none";
          }
        }, 500);
      });
    });

    const launcher = document.querySelector("#launcher, #destinationLauncher, .destination-launcher, .main-launcher, main");
    if (launcher) {
      launcher.style.pointerEvents = "auto";
      launcher.style.opacity = launcher.style.opacity === "0" ? "1" : launcher.style.opacity;
      launcher.style.visibility = "visible";
    }
  }

  function fireVacationEffects() {
    const effectNames = [
      "launchVacationEmojiStorm",
      "triggerVacationModeEffects",
      "startVacationEmojiRain",
      "createVacationEmojiRain",
      "launchEmojiStorm",
      "startEmojiStorm",
      "vacationModeEffects"
    ];

    effectNames.forEach(name => {
      if (typeof window[name] === "function") {
        try { window[name](); } catch (e) { console.warn("Vacation effect failed:", name, e); }
      }
    });
  }

  function buttonCurrentlySaysDeactivate(btn) {
    const txt = ((btn && (btn.textContent || btn.value)) || "").toLowerCase();
    return txt.includes("deactivate") || txt.includes("turn off") || txt.includes("stop");
  }

  function handleVacationButtonClick(event) {
    const btn = event.currentTarget || event.target;
    const intendsToActivate = !buttonCurrentlySaysDeactivate(btn) && !window.COONEY_VACATION_MODE_ON;

    // Let existing page animation code fire first, then clean up audio stack immediately after.
    setTimeout(() => {
      if (intendsToActivate) {
        unlockLandingIfPresent();
        startVacationAudio(getSelectedSongOrPick());
        fireVacationEffects();
      } else {
        stopAllVacationAudio();
      }
    }, 0);

    // Extra cleanup passes catch delayed old audio scripts without killing our singleton.
    setTimeout(() => {
      if (window.COONEY_VACATION_MODE_ON) stopAllAudioExcept(getSingletonAudio());
      else stopAllVacationAudio();
    }, 150);

    setTimeout(() => {
      if (window.COONEY_VACATION_MODE_ON) stopAllAudioExcept(getSingletonAudio());
      else stopAllVacationAudio();
    }, 800);
  }

  function bindVacationButton() {
    const btn = findVacationButton();
    if (!btn || btn.dataset.cooneyAudioControllerBound === "true") return;
    btn.dataset.cooneyAudioControllerBound = "true";
    btn.addEventListener("click", handleVacationButtonClick, false);
    setVacationButtonState(false);
  }

  function injectStyles() {
    if (document.getElementById("cooney-weather-overlay-css")) return;
    const css = document.createElement("style");
    css.id = "cooney-weather-overlay-css";
    css.textContent = `
      .cooney-weather-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;}
      .cooney-weather-modal{width:min(960px,96vw);max-height:92vh;overflow:auto;border-radius:28px;background:linear-gradient(145deg,rgba(12,24,52,.97),rgba(20,36,76,.92));box-shadow:0 30px 90px rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.20);color:white;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;position:relative;}
      .cooney-weather-head{padding:24px 24px 14px;display:flex;gap:18px;justify-content:space-between;align-items:flex-start;border-bottom:1px solid rgba(255,255,255,.14);}
      .cooney-weather-kicker{letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#ffd66b;font-weight:900;}
      .cooney-weather-title{font-size:clamp(26px,4vw,44px);font-weight:1000;line-height:1;margin:6px 0 8px;}
      .cooney-weather-sub{font-size:15px;color:rgba(255,255,255,.82);max-width:700px;}
      .cooney-weather-close{appearance:none;border:0;border-radius:999px;padding:12px 16px;background:rgba(255,255,255,.15);color:white;font-weight:900;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);}
      .cooney-weather-body{padding:18px 24px 24px;}
      .cooney-weather-vibe{border-radius:22px;background:linear-gradient(135deg,rgba(255,214,107,.22),rgba(255,255,255,.08));padding:18px;margin-bottom:16px;border:1px solid rgba(255,214,107,.26);}
      .cooney-weather-vibe b{display:block;font-size:20px;margin-bottom:6px;}
      .cooney-weather-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
      .cooney-weather-card{border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14);padding:15px;min-height:135px;}
      .cooney-weather-card .top{display:flex;justify-content:space-between;gap:8px;font-weight:900;font-size:14px;color:#ffd66b;}
      .cooney-weather-card .temp{font-size:34px;font-weight:1000;margin-top:8px;}
      .cooney-weather-card .meta{font-size:13px;line-height:1.45;color:rgba(255,255,255,.82);}
      .cooney-weather-card .quip{margin-top:10px;font-size:13px;font-weight:800;color:white;}
      .cooney-weather-foot{font-size:12px;color:rgba(255,255,255,.65);margin-top:14px;}
      @media(max-width:760px){.cooney-weather-grid{grid-template-columns:1fr}.cooney-weather-head{flex-direction:column}.cooney-weather-close{align-self:flex-end}.cooney-weather-body{padding:14px}.cooney-weather-head{padding:18px}}
    `;
    document.head.appendChild(css);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    }[ch]));
  }

  function renderOverlay(loc, slots) {
    injectStyles();
    const first = slots[0] || { mood: CONFIG.defaultMood || "perfect", temp: 72, rain: 0, wind: 5, condition: "Clear" };
    const song = songForMood(first.mood);
    setSelectedWeatherSong(song);

    const quips = CONFIG.quips || {};
    const headlineQuip = pick(quips[first.mood]) || "Vacation weather has entered the chat.";
    const songLine = `${song.title || song.file}${song.artist ? " — " + song.artist : ""}`;

    const backdrop = document.createElement("div");
    backdrop.className = "cooney-weather-backdrop";
    backdrop.innerHTML = `
      <div class="cooney-weather-modal" role="dialog" aria-modal="true" aria-label="Weather vibe check">
        <div class="cooney-weather-head">
          <div>
            <div class="cooney-weather-kicker">Weather Vibe Check</div>
            <div class="cooney-weather-title">${escapeHtml(loc.name)}</div>
            <div class="cooney-weather-sub">Morning, afternoon, night, then tomorrow again. The forecast picks the quip and arms Vacation Mode with the matching song. It will not play until you hit Activate.</div>
          </div>
          <button class="cooney-weather-close" type="button">Let me in</button>
        </div>
        <div class="cooney-weather-body">
          <div class="cooney-weather-vibe">
            <b>🎵 ${escapeHtml(song.label || first.mood)} → ${escapeHtml(songLine)}</b>
            <div>${escapeHtml(headlineQuip)}</div>
          </div>
          <div class="cooney-weather-grid">
            ${slots.map(slot => `
              <div class="cooney-weather-card">
                <div class="top"><span>${escapeHtml(slot.emoji)} ${escapeHtml(slot.day)}</span><span>${escapeHtml(slot.period)}</span></div>
                <div class="temp">${escapeHtml(slot.temp)}°</div>
                <div class="meta">${escapeHtml(slot.condition)} · Rain ${escapeHtml(slot.rain)}% · Wind ${escapeHtml(slot.wind)} mph</div>
                <div class="quip">${escapeHtml(pick(quips[slot.mood]) || headlineQuip)}</div>
              </div>
            `).join("")}
          </div>
          <div class="cooney-weather-foot">Audio files stay in assets/audio/. This script only reads the filenames listed in assets/config/vacation-config.js.</div>
        </div>
      </div>`;

    const close = () => backdrop.remove();
    backdrop.querySelector(".cooney-weather-close").addEventListener("click", close);
    backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
  }

  async function loadWeatherAndShowOverlay() {
    const loc = getLocationConfig();
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(loc.latitude));
    url.searchParams.set("longitude", String(loc.longitude));
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,cloud_cover");
    url.searchParams.set("temperature_unit", "fahrenheit");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "3");

    try {
      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error("Weather fetch failed: " + response.status);
      const data = await response.json();
      const slots = summarize(data);
      renderOverlay(loc, slots);
    } catch (err) {
      console.warn("Weather overlay failed, using fallback:", err);
      const fallback = {
        day: "Today",
        period: "Vacation",
        emoji: "🍹",
        temp: 72,
        rain: 0,
        wind: 5,
        cloud: 0,
        code: 0,
        mood: CONFIG.defaultMood || "perfect",
        condition: "Clear"
      };
      renderOverlay(loc, [fallback]);
    }
  }

  function init() {
    getSingletonAudio();
    bindVacationButton();
    loadWeatherAndShowOverlay();

    // Some pages build/replace the button after load. Re-bind safely.
    setTimeout(bindVacationButton, 500);
    setTimeout(bindVacationButton, 1500);
  }

  window.CooneyVacationAudio = {
    start: startVacationAudio,
    stop: stopAllVacationAudio,
    pickSong: songForMood,
    setSong: setSelectedWeatherSong,
    getAudio: getSingletonAudio,
    stopAllExcept: stopAllAudioExcept
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
