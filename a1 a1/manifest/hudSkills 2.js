(function(global){
  const HUD = {}; let atlas=null, sheet1x=null, sheet2x=null; const buttons=new Map(); let last=performance.now();
  function el(t,c){const e=document.createElement(t); if(c) e.className=c; return e;}
  function loadImg(u){return new Promise((res,rej)=>{const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=u;});}
  HUD.init = async function(opts){
    atlas = await fetch(opts.atlasUrl).then(r=>r.json());
    sheet1x = await loadImg(opts.icons1x); sheet2x = await loadImg(opts.icons2x);
    const wrap = el('div'); wrap.style.cssText="display:flex;gap:18px;flex-wrap:wrap"; (opts.mount||document.body).appendChild(wrap);
    for(const id of opts.buttons){
      const root=el('div'); root.style.cssText="position:relative;width:96px;height:96px";
      const base=el('img'); base.src=opts.base1x; base.srcset=opts.base1x+" 1x, "+opts.base2x+" 2x";
      const icon=el('img'); icon.style.cssText="position:absolute;left:50%;top:50%;width:64px;height:64px;transform:translate(-50%,-50%);image-rendering:pixelated;border-radius:8px";
      const cool=el('div'); cool.style.cssText="position:absolute;inset:0;background:conic-gradient(rgba(0,0,0,.55) var(--deg,0deg), rgba(0,0,0,0) 0);-webkit-mask: radial-gradient(closest-side, transparent 44%, #000 45%, #000 56%, transparent 57%);mask: radial-gradient(closest-side, transparent 44%, #000 45%, #000 56%, transparent 57%)";
      const ring=el('div'); ring.style.cssText="position:absolute;inset:0;background:url('"+opts.ring+"') center/contain no-repeat";
      const pressed=el('img'); pressed.src=opts.pressed1x; pressed.srcset=opts.pressed1x+" 1x, "+opts.pressed2x+" 2x"; pressed.style.cssText="position:absolute;inset:0;opacity:0;transition:opacity .08s ease";
      root.append(base,icon,cool,ring,pressed); wrap.append(root); buttons.set(id,{icon,cool,dur:3,cd:0});
      root.addEventListener('pointerdown',()=>pressed.style.opacity=.35); root.addEventListener('pointerup',()=>pressed.style.opacity=0); root.addEventListener('pointerleave',()=>pressed.style.opacity=0);
    }
    let last=performance.now(); function tick(t){const dt=(t-last)/1000; last=t; for(const b of buttons.values()){ if(b.cd>0){ b.cd-=dt; if(b.cd<0)b.cd=0; b.cool.style.setProperty('--deg', 360*(b.cd/b.dur)+'deg'); } } requestAnimationFrame(tick);} requestAnimationFrame(tick);
    return HUD;
  };
  function frameFor(name){ const fr=atlas.frames['ui/UI_Icons.png'][name]; if(!fr) throw new Error('icon '+name+' missing'); return fr; }
  HUD.setIcon = function(id, name){
    const b=buttons.get(id); const fr=frameFor(name);
    const c1=document.createElement('canvas'); c1.width=fr.w; c1.height=fr.h; const g1=c1.getContext('2d'); g1.imageSmoothingEnabled=false; g1.drawImage(sheet1x, fr.x,fr.y,fr.w,fr.h, 0,0,fr.w,fr.h); const u1=c1.toDataURL('image/png');
    const c2=document.createElement('canvas'); c2.width=fr.w*2; c2.height=fr.h*2; const g2=c2.getContext('2d'); g2.imageSmoothingEnabled=false; g2.drawImage(sheet2x, fr.x*2,fr.y*2,fr.w*2,fr.h*2, 0,0,fr.w*2,fr.h*2); const u2=c2.toDataURL('image/png');
    b.icon.src=u1; b.icon.srcset=u1+' 1x, '+u2+' 2x';
  };
  HUD.triggerCooldown=function(id,sec){const b=buttons.get(id); b.dur=Math.max(.2, sec||b.dur); b.cd=b.dur; b.cool.style.setProperty('--deg','360deg');};
  global.HUD=HUD;
})(window);
