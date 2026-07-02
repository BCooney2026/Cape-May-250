(function(){
  const CONFIG = window.COONEY_VACATION_CONFIG || {};
  const PERIODS = [
    { key:'morning', label:'Morning', start:6, end:12, emoji:'☕' },
    { key:'afternoon', label:'Afternoon', start:12, end:18, emoji:'🌞' },
    { key:'night', label:'Night', start:18, end:24, emoji:'🌙' }
  ];

  function pageKey(){
    const last = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return last || 'index.html';
  }

  function getLocationConfig(){
    const locs = CONFIG.locations || {};
    return locs[pageKey()] || locs['index.html'] || { name:'Jersey Shore', latitude:39.1012, longitude:-74.7177 };
  }

  function pick(arr){ return arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : ''; }

  function codeMeansRain(code){ return [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(Number(code)); }
  function codeMeansStorm(code){ return [95,96,99].includes(Number(code)); }
  function codeMeansCloudy(code){ return [2,3,45,48].includes(Number(code)); }

  function classifyMood(slot){
    const temp = slot.temp ?? 72;
    const rain = slot.rain ?? 0;
    const wind = slot.wind ?? 0;
    const cloud = slot.cloud ?? 0;
    const code = slot.code ?? 0;
    if(codeMeansStorm(code) || rain >= 70) return 'storm';
    if(codeMeansRain(code) || rain >= 45) return 'rain';
    if(temp >= 86) return 'hot';
    if(temp < 60) return 'cold';
    if(wind >= 22) return 'windy';
    if(codeMeansCloudy(code) || cloud >= 72) return 'cloudy';
    return 'perfect';
  }

  function weatherLabel(code){
    code = Number(code);
    if(codeMeansStorm(code)) return 'Stormy';
    if(codeMeansRain(code)) return 'Rainy';
    if([71,73,75,77,85,86].includes(code)) return 'Snowy';
    if([45,48].includes(code)) return 'Foggy';
    if([2,3].includes(code)) return 'Cloudy';
    if(code === 1) return 'Mostly clear';
    return 'Clear';
  }

  function avg(nums){ const clean = nums.filter(n => Number.isFinite(n)); return clean.length ? clean.reduce((a,b)=>a+b,0)/clean.length : null; }
  function max(nums){ const clean = nums.filter(n => Number.isFinite(n)); return clean.length ? Math.max(...clean) : null; }
  function mostCommon(nums){
    const counts = new Map();
    nums.filter(n => n !== null && n !== undefined).forEach(n => counts.set(n, (counts.get(n)||0)+1));
    let best = null, bestCount = -1;
    counts.forEach((count, val) => { if(count > bestCount){ best = val; bestCount = count; } });
    return best ?? 0;
  }

  function fmtDate(d){ return d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' }); }

  function summarize(data){
    const h = data.hourly || {};
    const rows = (h.time || []).map((t,i) => ({
      date: new Date(t),
      temp: Number(h.temperature_2m?.[i]),
      rain: Number(h.precipitation_probability?.[i]),
      wind: Number(h.wind_speed_10m?.[i]),
      cloud: Number(h.cloud_cover?.[i]),
      code: Number(h.weather_code?.[i])
    }));
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    const dates = [today, tomorrow];
    const out = [];
    dates.forEach(day => {
      PERIODS.forEach(period => {
        const periodRows = rows.filter(r => {
          const rd = new Date(r.date); rd.setHours(0,0,0,0);
          const hour = r.date.getHours();
          return rd.getTime() === day.getTime() && hour >= period.start && hour < period.end;
        });
        if(!periodRows.length) return;
        const slot = {
          day: fmtDate(day),
          period: period.label,
          emoji: period.emoji,
          temp: Math.round(avg(periodRows.map(r=>r.temp)) ?? 0),
          rain: Math.round(max(periodRows.map(r=>r.rain)) ?? 0),
          wind: Math.round(avg(periodRows.map(r=>r.wind)) ?? 0),
          cloud: Math.round(avg(periodRows.map(r=>r.cloud)) ?? 0),
          code: mostCommon(periodRows.map(r=>r.code))
        };
        slot.mood = classifyMood(slot);
        slot.condition = weatherLabel(slot.code);
        out.push(slot);
      });
    });
    return out.slice(0, 6);
  }

  function songForMood(mood){
    const songs = CONFIG.weatherSongs || {};
    const base = CONFIG.audioBasePath || 'assets/audio/';
    const bucket = songs[mood] || songs[CONFIG.defaultMood || 'perfect'] || { file:'perfect1.mp3', label:'Perfect Vacation Mode' };

    // Supports any number of songs per category: tracks: [{file,title,artist}, ...]
    // Also supports the old one-song format: {file,label}
    let candidates = Array.isArray(bucket.tracks) && bucket.tracks.length
      ? bucket.tracks.map(track => ({ ...track }))
      : [{ file: bucket.file || 'perfect1.mp3', title: bucket.example || bucket.label || mood, artist: '' }];

    const lastKey = 'cooneyLastWeatherSong_' + mood;
    let lastFile = '';
    try{ lastFile = localStorage.getItem(lastKey) || ''; }catch(e){}

    // Do not play the same file back-to-back when there is another option.
    if(candidates.length > 1){
      const filtered = candidates.filter(track => track.file !== lastFile);
      if(filtered.length) candidates = filtered;
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
    try{ localStorage.setItem(lastKey, chosen.file || ''); }catch(e){}

    return {
      ...bucket,
      ...chosen,
      mood,
      label: bucket.label || mood,
      src: base + chosen.file
    };
  }

  function setVacationAudio(song){
    const audio = document.getElementById('cooneyAudio') || document.querySelector('audio');
    if(!audio || !song || !song.src) return;
    const wasPaused = audio.paused;
    const previous = audio.getAttribute('src') || '';
    if(previous.indexOf(song.file) === -1){
      audio.setAttribute('src', song.src);
      try{ audio.load(); }catch(e){}
    }
    window.COONEY_SELECTED_WEATHER_SONG = song;
    try{ localStorage.setItem('cooneyWeatherSong', JSON.stringify(song)); }catch(e){}
    if(!wasPaused){ audio.play().catch(()=>{}); }
  }

  function injectStyles(){
    if(document.getElementById('cooney-weather-overlay-css')) return;
    const css = document.createElement('style');
    css.id = 'cooney-weather-overlay-css';
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

  function renderOverlay(loc, slots){
    injectStyles();
    const first = slots[0] || { mood: CONFIG.defaultMood || 'perfect', temp: 72, rain: 0, wind: 5, condition:'Clear' };
    const song = songForMood(first.mood);
    setVacationAudio(song);
    const quips = CONFIG.quips || {};
    const headlineQuip = pick(quips[first.mood]) || 'Vacation weather has entered the chat.';

    const backdrop = document.createElement('div');
    backdrop.className = 'cooney-weather-backdrop';
    backdrop.innerHTML = `
      <div class="cooney-weather-modal" role="dialog" aria-modal="true" aria-label="Weather vibe check">
        <div class="cooney-weather-head">
          <div>
            <div class="cooney-weather-kicker">Weather Vibe Check</div>
            <div class="cooney-weather-title">${loc.name}</div>
            <div class="cooney-weather-sub">Morning, afternoon, night, then tomorrow again. The forecast picks the quip and wires Vacation Mode to the matching song.</div>
          </div>
          <button class="cooney-weather-close" type="button">Let me in</button>
        </div>
        <div class="cooney-weather-body">
          <div class="cooney-weather-vibe">
            <b>🎵 ${song.label || first.mood} → ${song.file}</b>
            <div>${headlineQuip}</div>
          </div>
          <div class="cooney-weather-grid">
            ${slots.map(slot => `
              <div class="cooney-weather-card">
                <div class="top"><span>${slot.emoji} ${slot.day}</span><span>${slot.period}</span></div>
                <div class="temp">${slot.temp}°</div>
                <div class="meta">${slot.condition} · Rain ${slot.rain}% · Wind ${slot.wind} mph</div>
                <div class="quip">${pick(quips[slot.mood]) || headlineQuip}</div>
              </div>
            `).join('')}
          </div>
          <div class="cooney-weather-foot">Song files live in assets/audio/. Add as many as you want per category, then list them in assets/config/vacation-config.js. Same song will not repeat back-to-back when there is another option.</div>
        </div>
      </div>`;
    const close = () => backdrop.remove();
    backdrop.querySelector('.cooney-weather-close').addEventListener('click', close);
    backdrop.addEventListener('click', e => { if(e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
  }

  async function start(){
    if(window.COONEY_WEATHER_OVERLAY_OFF) return;
    const loc = getLocationConfig();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(loc.latitude)}&longitude=${encodeURIComponent(loc.longitude)}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,cloud_cover&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=3&timezone=auto`;
    try{
      const res = await fetch(url, { cache:'no-store' });
      if(!res.ok) throw new Error('weather failed');
      const data = await res.json();
      const slots = summarize(data);
      renderOverlay(loc, slots);
    }catch(e){
      const mood = CONFIG.defaultMood || 'perfect';
      const song = songForMood(mood);
      setVacationAudio(song);
      renderOverlay(loc, [
        { day:'Today', period:'Now', emoji:'🎵', temp:'--', rain:'--', wind:'--', mood, condition:'Forecast unavailable' }
      ]);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
