// ===== A1K Runner – Tight Patch Pack =====
// Features:
// 1) Overlap → bounce the player back (no ghost-pass). Contact damage still ticks.
// 2) Unique has no melee reflect (A1 + Missy keep reflect).
// 3) Mobs never home; only mini-boss & boss bullets may home (clamped turn rate).
// 4) Unique basic rework: 2–3 simultaneous lock-on piercers; each hit adds 10% current-HP dmg with clamps.
//
// Integration notes:
// - These snippets are written against the single-file build that uses: st.players, st.enemies,
//   st.shots (player), st.eShots (enemy), laneY(), nearestEnemy(), etc.
// - Search for the INSERT/REPLACE markers below.

/* --------------------------------------------------------------------------
 * [A] MOB PROXIMITY + PLAYER KNOCKBACK
 * --------------------------------------------------------------------------
 * INSERT near your enemy update loop, right after you set m.vx/m.vy each frame.
 */

// === Tunables ===
const MOB_STANDOFF = 42;     // pause distance from leader
const MOB_BACKSTEP = 26;     // back-up distance
const MOB_BACKSPD  = 0.12;   // speed while backing up (rightward)
const MOB_HALT_T   = 420;    // ms pause when at standoff
const CONTACT_TICK = 350;    // ms between contact dmg ticks
const KB_FORCE     = 0.6;    // player knockback vx impulse
const KB_TIME      = 220;    // ms knockback decay window

function applyKnockback(actor, fromX, force=KB_FORCE){
  const dir = Math.sign(actor.x - fromX) || 1; // push away from mob
  actor.vx += dir * force;
  actor.kbT = KB_TIME;       // decay timer (see player update patch)
}

function applyContactDamage(player, dmg){
  // Minimal shim — wire into your existing damage/shield system if you have one
  if (st._shieldOn) {
    st._shieldT = Math.max(0, (st._shieldT||0) - 120); // nibble shield duration
  } else {
    st.hp = Math.max(0, st.hp - dmg);
  }
}

function updateMobBehavior(m, dt, leader){
  const dx = leader.x - m.x;
  const ax = Math.abs(dx);

  m._haltT  = (m._haltT  || 0) - dt;
  m._ctickT = (m._ctickT || 0) - dt;
  m._stickT = (m._stickT || 0) - dt;

  // Contact damage + bounce after lingering overlap
  const touching = ax < 14 && Math.abs(leader.y - m.y) < 28;
  if (touching && m._ctickT <= 0){
    applyContactDamage(leader, m.contactDmg || 6);
    m._ctickT = CONTACT_TICK;
    m._stickT = (m._stickT > 0 ? m._stickT : 0) + dt;
    if (m._stickT > 180){
      applyKnockback(leader, m.x);
      m._stickT = 0;
    }
  } else {
    m._stickT = 0;
  }

  // Approach logic (no face-planting)
  if (dx < 0) { // mob is right of player, moving left
    if (ax <= MOB_BACKSTEP) {
      m.state = 'backstep';
      m.vx = +MOB_BACKSPD;          // nudge away to re-aim
    } else if (ax <= MOB_STANDOFF && m._haltT <= 0) {
      m.state = 'halt';
      m.vx = 0;                     // brief aim pause
      m._haltT = MOB_HALT_T;
    } else if (m.state !== 'backstep') {
      m.state = 'advance';          // keep default leftward drift
    }
  }
}

/* Player update hook — INSERT in your player update step */
function dampKnockback(p, dt){
  if (p.kbT && p.kbT > 0){
    p.kbT -= dt;
    p.vx *= 0.94; // gentle decay so the player settles quickly
    if (p.kbT <= 0) p.kbT = 0;
  }
}

/* --------------------------------------------------------------------------
 * [B] REFLECT: KEEP FOR A1 & MISSY ONLY
 * --------------------------------------------------------------------------
 * REPLACE any generic “melee reflect for all heroes” with these guarded calls.
 */

function reflectProjectiles(hitbox, dmgBoost=1.0){
  for (let i=0;i<st.eShots.length;i++){
    const p = st.eShots[i];
    if (p.dead) continue;
    if (p.x > hitbox.x && p.x < hitbox.x+hitbox.w && p.y > hitbox.y && p.y < hitbox.y+hitbox.h){
      p.owner = 'player';
      p.team  = 'player';
      p.dmg   = Math.round((p.dmg||8) * dmgBoost);
      p.pierce = Math.max(p.pierce||0, 1);
      p.seek   = true;             // reflected shots may home (clamped)
      p.turn   = 8;                // deg per 60fps — adjust to taste
    }
  }
}

// During A1 or Missy melee frames only:
// if (hero.id==='A1'   && isMeleeActive) reflectProjectiles(hero.swingHitbox(), 1.1);
// if (hero.id==='Missy'&& isMeleeActive) reflectProjectiles(hero.swingHitbox(), 1.05);
// (Unique has no melee; do not call reflect for Unique.)

/* --------------------------------------------------------------------------
 * [C] PROJECTILE HOMING RULES
 * --------------------------------------------------------------------------
 * REPLACE mob bullet spawns so normal mobs never home; mini/boss may home.
 */

function spawnMobBullet(m){
  const b = {x:m.x-10, y:m.y, vx:-0.9, vy:0, dmg:8, pierce:0, owner:'enemy'};
  b.seek = false; b.turn = 0;
  st.eShots.push(b);
}

function spawnEliteBullet(e){
  const b = {x:e.x-12, y:e.y, vx:-1.0, vy:0, dmg:12, pierce:0, owner:'enemy'};
  b.seek = true; b.turn = 8; // clamp turn rate
  st.eShots.push(b);
}

// When creating player projectiles, keep homing but clamped
function armPlayerProjectile(p){ p.seek = true; p.turn = 8; }

/* --------------------------------------------------------------------------
 * [D] UNIQUE BASIC REWORK — 2–3 SIMUL LOCK-ON PIERcers + %HP DMG
 * --------------------------------------------------------------------------
 * INSERT into Unique’s basic-fire handler; remove Unique melee calls elsewhere.
 */

// Utility: %HP damage component with clamps (prevents boss melts)
function percentHpDamage(target, frac, minFlat=6, maxFlat=120){
  const v = Math.round(target.hp * frac);
  return Math.max(minFlat, Math.min(maxFlat, v));
}

// HIT RESOLUTION — call this where your player-shot vs enemy collision resolves
function onPlayerShotHit(p, enemy){
  let dmg = p.dmg||0;
  if (p.percentHP){ dmg += percentHpDamage(enemy, p.percentHP, p.phMin||6, p.phMax||120); }
  enemy.hp -= dmg;
  if (enemy.hp <= 0){ enemy.hp = 0; }
  if (p.pierce>0){ p.pierce--; if(p.pierce<=0) p.dead=true; }
}

function uniqueBasicFire(u){
  const shots = 2 + Math.floor(Math.random()*2); // 2–3
  for (let i=0;i<shots;i++){
    const t = nearestEnemy(u) || {x:u.x+300, y:u.y};
    const dx = t.x - (u.x+12), dy = t.y - (u.y-6);
    const mag = Math.hypot(dx,dy)||1;
    const vx = +1.2 * (dx/mag), vy = +1.2 * (dy/mag);
    const b = {x:u.x+12, y:u.y-6, vx, vy, dmg:4, pierce:99, owner:'player'};
    b.percentHP = 0.10; // +10% current HP per hit
    b.phMin = 6; b.phMax = 120; // clamps
    b.seek = true; b.turn = 8;  // clamped homing
    st.shots.push(b);
  }
}

/* --------------------------------------------------------------------------
 * [E] WIRING POINTS
 * --------------------------------------------------------------------------
 * 1) In your main enemy update loop, after setting m.vx/vy, call:
 *      updateMobBehavior(m, dt*1000, leader());
 *    and in your player update step per frame call:
 *      dampKnockback(activePlayer, dt*1000);
 *
 * 2) Replace your Unique basic attack function body with uniqueBasicFire(unique).
 *
 * 3) Ensure your shot-vs-enemy resolution calls onPlayerShotHit(p, enemy) so the
 *    10% current-HP bonus applies.
 *
 * 4) Create mob bullets with spawnMobBullet(m), elite bullets with spawnEliteBullet(e)
 *    for mini-boss/boss patterns only.
 *
 * 5) Remove any reflect calls tied to Unique’s melee. Keep reflect calls for A1/Missy
 *    during their sword frames.
 */

// End of Patch Pack
