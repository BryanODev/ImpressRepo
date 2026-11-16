/* IMPRESS hero slider: section-safe, keyboard-accessible, pauses for interaction. */
(() => {
  const registry=new WeakMap();
  function mount(root){
    if(registry.has(root))return;
    const slides=Array.from(root.querySelectorAll('[data-ish-slide]'));
    if(slides.length<2)return;
    const dots=Array.from(root.querySelectorAll('[data-ish-dot]'));
    let current=0,timer=null,paused=false;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const autoplay=root.dataset.autoPlay==='true'&&!reduced;
    const interval=Math.max(3000,Number(root.dataset.interval)||6000);
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    function play(){stop();if(!autoplay||paused||document.hidden)return;timer=setInterval(()=>show(current+1),interval);}
    function show(next){
      current=((next%slides.length)+slides.length)%slides.length;
      slides.forEach((slide,i)=>{
        const active=i===current;
        slide.classList.toggle('is-active',active);
        slide.setAttribute('aria-hidden',String(!active));
        if(active)slide.removeAttribute('inert');else slide.setAttribute('inert','');
      });
      dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===current);dot.setAttribute('aria-current',String(i===current));});
    }
    const go=i=>{show(i);play();};
    root.querySelector('[data-ish-prev]')?.addEventListener('click',()=>go(current-1));
    root.querySelector('[data-ish-next]')?.addEventListener('click',()=>go(current+1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
    root.addEventListener('mouseenter',()=>{paused=true;stop();});
    root.addEventListener('mouseleave',()=>{paused=false;play();});
    root.addEventListener('focusin',()=>{paused=true;stop();});
    root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)){paused=false;play();}});
    root.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){if(event.target.closest('a'))return;event.preventDefault();go(current+(event.key==='ArrowRight'?1:-1));}});
    let startX=null;
    root.addEventListener('touchstart',e=>{startX=e.touches[0]?.clientX??null;},{passive:true});
    root.addEventListener('touchend',e=>{if(startX===null)return;const delta=(e.changedTouches[0]?.clientX??startX)-startX;startX=null;if(Math.abs(delta)>55)go(current+(delta<0?1:-1));},{passive:true});
    const onVis=()=>{if(document.hidden)stop();else play();};document.addEventListener('visibilitychange',onVis);
    const onSelect=event=>{const id=event.detail?.blockId;const index=slides.findIndex(slide=>slide.dataset.blockId===id);if(index>=0){paused=true;stop();show(index);}};
    const onDeselect=()=>{paused=false;play();};
    root.addEventListener('shopify:block:select',onSelect);
    root.addEventListener('shopify:block:deselect',onDeselect);
    root.addEventListener('shopify:section:unload',()=>{stop();document.removeEventListener('visibilitychange',onVis);registry.delete(root);},{once:true});
    registry.set(root,true);show(0);play();
  }
  const all=(context=document)=>context.querySelectorAll('[data-impress-slidehero]').forEach(mount);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>all(),{once:true});else all();
  document.addEventListener('shopify:section:load',event=>all(event.target));
})();
