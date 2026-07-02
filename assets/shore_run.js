
(function(){
 const body=document.body; const btn=document.querySelector('[data-mode-toggle]'); const label=document.querySelector('[data-mode-label]');
 const saved=localStorage.getItem('cooneyVacationMode')||'off';
 function setMode(on){body.classList.toggle('vacation-on',on); if(label) label.textContent=on?'Vacation Mode Activated':'Vacation Mode Deactivated'; if(btn) btn.textContent=on?'Deactivate Vacation Mode':'Activate Vacation Mode'; localStorage.setItem('cooneyVacationMode',on?'on':'off');}
 setMode(saved==='on'); if(btn) btn.addEventListener('click',()=>setMode(!body.classList.contains('vacation-on')));
 const audio=document.querySelector('#vacationAudio'); const play=document.querySelector('[data-audio-play]'); const stop=document.querySelector('[data-audio-stop]'); const vol=document.querySelector('[data-audio-volume]');
 if(audio){audio.volume=.55; if(play) play.addEventListener('click',async()=>{try{await audio.play(); play.textContent='Music Playing';}catch(e){play.textContent='Tap Again to Play';}}); if(stop) stop.addEventListener('click',()=>{audio.pause(); audio.currentTime=0; if(play) play.textContent='Play Vacation Music';}); if(vol) vol.addEventListener('input',()=>audio.volume=Number(vol.value));}
})();
