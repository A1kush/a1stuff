// Lightweight sword VFX module for A1 (visual only)
// API:
//  A1VFX.init({ mobSizePx, bossSizePx })
//  A1VFX.slash({ x, y, angle, isAirborne, tier, emitWave })
//  A1VFX.impact({ x, y })
//  A1VFX.wave({ x, y, angle, tier, isAirborne })
//  A1VFX.tick(dt, ctx)
// Notes: purely cosmetic — does not change damage, CDs or hit counts.
(function (g) {
  const V = {
    cfg: { mobSizePx: 42, bossSizePx: 140 },
    list: [],
    init(opts) { Object.assign(this.cfg, opts || {}); },
    slash(p) {
      const life = 220;
      this.list.push({ kind: 'slash', x: p.x, y: p.y - 36, ang: (p.angle||0), air: !!p.isAirborne, t: life, max: life, waveTier: p.emitWave ? (p.tier||'base') : null });
      if (p.emitWave) this.wave({ x: p.x + Math.cos(p.angle||0) * 24, y: p.y - 40, angle: p.angle||0, tier: p.tier||'base', isAirborne: !!p.isAirborne });
    },
    impact(p){ this.list.push({ kind:'impact', x:p.x, y:p.y, t:180, max:180 }); },
    wave(p){
      // Create a fat crescent that flies forward and fades
      const tier = p.tier||'base';
      const mob = this.cfg.mobSizePx, boss = this.cfg.bossSizePx;
      let w = mob*5, h = mob*1.2; // base/S1 ~ 5x mob
      if(tier==='s2' || tier==='s3') { w = boss; h = boss*0.45; }
      if(tier==='rage') { w = boss*2; h = boss*0.6; }
      if(p.isAirborne){ w = Math.round(w*1.4); h = Math.round(h*1.4); }
      const life = 620;
      this.list.push({ kind:'wave', x:p.x, y:p.y-40, ang:(p.angle||0), w, h, t:life, max:life, bobAmp: p.isAirborne?0: (3+Math.random()*2), bobHz: 2.2, air:!!p.isAirborne });
    },
    tick(dt, ctx){
      // update + draw
      const arr = this.list;
      for(let i=0;i<arr.length;i++){
        const e = arr[i]; e.t -= dt*1000; if(e.t<=0){ arr.splice(i--,1); continue; }
        if(e.kind==='slash'){
          // trailing arc
          const p = 1 - e.t/e.max;
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(e.ang||0);
          const r = 28 + (e.air?8:0);
          ctx.globalAlpha = 0.8*(1-p);
          ctx.strokeStyle = '#ff7a31';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(0, 0, r, -0.9, 0.6); ctx.stroke();
          ctx.globalAlpha = 0.45*(1-p);
          ctx.strokeStyle = '#7b61ff'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, r+4, -0.9, 0.6); ctx.stroke();
          ctx.restore();
        } else if(e.kind==='impact'){
          const p = 1 - e.t/e.max; ctx.globalAlpha = Math.max(0, 0.9 - p);
          ctx.strokeStyle = '#ffd56a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(e.x, e.y, 6 + p*10, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
        } else if(e.kind==='wave'){
          // floor-rider bob (visual only)
          if(!e.air){ const ang = (1 - e.t/e.max) * Math.PI * 2 * (e.bobHz||2.2); e._off = Math.sin(ang) * (e.bobAmp||4); }
          const x = e.x, y = e.y + (e._off||0);
          const w = e.w, h = e.h; const p = e.t/e.max;
          // body
          const grd = ctx.createLinearGradient(x - w/2, y, x + w/2, y);
          grd.addColorStop(0, 'rgba(255,77,79,'+(0.25+0.15*p)+')');
          grd.addColorStop(0.5, 'rgba(123,97,255,'+(0.35+0.20*p)+')');
          grd.addColorStop(1, 'rgba(255,77,79,'+(0.25+0.15*p)+')');
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(e.ang||0);
          ctx.fillStyle = grd; ctx.fillRect(-w/2, -h/2, w, h);
          ctx.globalAlpha = 0.35; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(-w/2, -h/2, w, h);
          ctx.restore(); ctx.globalAlpha = 1;
        }
      }
    }
  };
  g.A1VFX = V;
})(window);

