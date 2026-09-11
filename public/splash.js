(function(){
  var s=document.getElementById('splash'); if(!s) return;
  // only on a first arrival — moving between pages should not replay it
  try{ if(sessionStorage.getItem('oyff-seen')){ s.remove(); return; } }catch(e){}
  document.body.classList.add('splashing');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ings=[].slice.call(s.querySelectorAll('.ing')),
      dims=[].slice.call(s.querySelectorAll('.dim-rail i')),
      ring=s.querySelector('.splash-ring'),
      marks=[].slice.call(s.querySelectorAll('.splash-mark')),
      scene=s.querySelector('.scene'),
      tag=s.querySelector('.splash-tag'), ent=s.querySelector('.splash-enter'),
      skip=s.querySelector('.splash-skip'), timers=[], done=false;
  function at(ms,fn){ timers.push(setTimeout(fn,reduced?Math.min(ms,120):ms)); }
  function enter(){
    if(done) return; done=true;
    timers.forEach(clearTimeout);
    try{ sessionStorage.setItem('oyff-seen','1'); }catch(e){}
    s.hidden=true; document.body.classList.remove('splashing');
    setTimeout(function(){ s.remove(); },900);
    document.removeEventListener('keydown',enter);
  }
  // fade the photograph in once it has decoded, never half-painted
  function showScene(){ requestAnimationFrame(function(){ scene.classList.add('on'); }); }
  if(scene){ if(scene.complete && scene.naturalWidth) showScene();
             else scene.addEventListener('load',showScene); }
  // The ingredient roll used to run at 760ms a step and the whole screen
  // held for eleven seconds. Nobody waits eleven seconds to read a bakery
  // menu, so the same choreography now plays out in about six, and the
  // way out appears inside two.
  at(60,function(){ ring.classList.add('on'); });
  at(320,function(){ marks.forEach(function(m){ m.classList.add('on'); }); });
  ings.forEach(function(el,i){
    at(900+i*500,function(){ el.classList.add('on'); });
    if(i<ings.length-1) at(900+(i+1)*500,function(){ el.classList.remove('on'); el.classList.add('gone'); });
  });
  dims.forEach(function(el,i){ at(1020+i*500,function(){ el.classList.add('on'); }); });
  at(1700,function(){ tag.classList.add('on'); });
  at(1900,function(){ ent.classList.add('on'); skip.classList.add('on'); });
  at(6000,enter);                        // never trap anyone behind it
  ent.addEventListener('click',function(e){ e.preventDefault(); enter(); });
  s.addEventListener('click',enter);
  document.addEventListener('keydown',enter);
})();
