// Cooney Mobile Playbook Overlay v30
// Safe layer only: no audio, no Vacation Mode state, no weather controller changes.
(function(){
  'use strict';

  const PLAYBOOKS = {
    'ac-arrival': {
      kicker: 'Atlantic City • One-Night Finale',
      title: 'AC Arrival Strategy',
      subtitle: 'The whole assignment: slide out of Avalon, make the smart stop early, park once, and let Atlantic City be the neon victory lap.',
      pdf: 'pdfs/ac/01_AC_Arrival_Strategy.pdf',
      alertIcon: '🎰',
      alertTitle: 'The AC rule is simple',
      alertText: 'Do not turn one night into a logistics marathon. AC is the finale, not a homework assignment with parking fees.',
      steps: [
        {
          icon: '🚗',
          title: 'Leave Avalon Easy',
          text: 'No heroic checkout energy. Coffee, bags, slow roll. The goal is to arrive in AC relaxed, not already annoyed.'
        },
        {
          icon: '🌿',
          title: 'Optional Premium Stop',
          text: 'If you are doing the dispensary stop, do it before hotel/casino mode and before drinks. Primary: High Rollers. Backup: Design 710.'
        },
        {
          icon: '🅿️',
          title: 'Park Once',
          text: 'Once the car is parked, it is done for the night. Walk, Jitney, or Uber. Nobody wins a vacation by fighting Atlantic City parking twice.'
        },
        {
          icon: '🍸',
          title: 'Go Neon',
          text: 'Casino lights, people watching, boardwalk chaos, cocktails, and zero pressure to over-plan. This is the last-night victory lap.'
        },
        {
          icon: '☕',
          title: 'Friday Breakout',
          text: 'Wake up, coffee, pack, leave when ready, home pool-bar recovery. AC does not require a meaningful morning personality.',
          full: true,
          bullets: [
            'Keep anything sealed/stored and follow NJ rules.',
            'Nobody drives impaired. That is not a vacation joke.',
            'If the plan starts feeling complicated, simplify it immediately.'
          ]
        }
      ]
    }
  };

  let overlay = null;
  let previousBodyOverflow = '';

  function buildOverlay(){
    if(overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'cooney-playbook-overlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = '<div class="cooney-playbook-shell" role="dialog" aria-modal="true" aria-label="Cooney mobile playbook">'
      + '<header class="cooney-playbook-head">'
      + '<button type="button" class="cooney-playbook-close" aria-label="Close playbook">×</button>'
      + '<div class="cooney-playbook-kicker"></div>'
      + '<h2 class="cooney-playbook-title"></h2>'
      + '<p class="cooney-playbook-subtitle"></p>'
      + '</header>'
      + '<div class="cooney-playbook-body">'
      + '<div class="cooney-playbook-alert"><span class="cooney-playbook-alert-icon"></span><div><b></b><p></p></div></div>'
      + '<div class="cooney-playbook-grid"></div>'
      + '<div class="cooney-playbook-actions">'
      + '<a class="cooney-playbook-button" target="_blank" rel="noopener">Open Printable PDF</a>'
      + '<button type="button" class="cooney-playbook-button secondary">Back to AC Page</button>'
      + '</div>'
      + '<p class="cooney-playbook-footer-note">Mobile playbook test card. Audio, Weather Vacation Mode, and D overlays stay untouched.</p>'
      + '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(event){
      if(event.target === overlay) closePlaybook();
    });

    overlay.querySelector('.cooney-playbook-close').addEventListener('click', closePlaybook);
    overlay.querySelector('.cooney-playbook-button.secondary').addEventListener('click', closePlaybook);

    document.addEventListener('keydown', function(event){
      if(event.key === 'Escape' && overlay && overlay.classList.contains('is-open')) closePlaybook();
    });

    return overlay;
  }

  function stepMarkup(step){
    const bullets = Array.isArray(step.bullets) && step.bullets.length
      ? '<ul class="cooney-playbook-list">' + step.bullets.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
      : '';
    return '<article class="cooney-playbook-step' + (step.full ? ' full' : '') + '">'
      + '<h3><span>' + escapeHtml(step.icon || '✨') + '</span>' + escapeHtml(step.title || '') + '</h3>'
      + '<p>' + escapeHtml(step.text || '') + '</p>'
      + bullets
      + '</article>';
  }

  function openPlaybook(key, fallbackPdf){
    const data = PLAYBOOKS[key];
    if(!data) return;

    const el = buildOverlay();
    el.querySelector('.cooney-playbook-kicker').textContent = data.kicker || 'Cooney Playbook';
    el.querySelector('.cooney-playbook-title').textContent = data.title || 'Mobile Playbook';
    el.querySelector('.cooney-playbook-subtitle').textContent = data.subtitle || '';
    el.querySelector('.cooney-playbook-alert-icon').textContent = data.alertIcon || '✨';
    el.querySelector('.cooney-playbook-alert b').textContent = data.alertTitle || 'Quick read';
    el.querySelector('.cooney-playbook-alert p').textContent = data.alertText || '';
    el.querySelector('.cooney-playbook-grid').innerHTML = (data.steps || []).map(stepMarkup).join('');
    el.querySelector('.cooney-playbook-button').setAttribute('href', data.pdf || fallbackPdf || '#');

    previousBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    el.classList.add('is-open');
    el.setAttribute('aria-hidden','false');

    const closeButton = el.querySelector('.cooney-playbook-close');
    if(closeButton) closeButton.focus({preventScroll:true});
  }

  function closePlaybook(){
    if(!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = previousBodyOverflow;
  }

  function escapeHtml(value){
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function init(){
    document.querySelectorAll('[data-cooney-playbook]').forEach(function(link){
      link.addEventListener('click', function(event){
        event.preventDefault();
        openPlaybook(link.getAttribute('data-cooney-playbook'), link.getAttribute('data-playbook-pdf') || link.getAttribute('href'));
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }

  window.cooneyOpenMobilePlaybook = openPlaybook;
  window.cooneyCloseMobilePlaybook = closePlaybook;
})();
