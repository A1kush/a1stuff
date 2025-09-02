// A1K v13.7 — key gates (engine-agnostic)
const DMG_OVR = config.overrides.enable_v13_7_damage_overrides === true;

function applySkillDamage(base){
  return DMG_OVR ? Math.round(base * config.overrides.skill_damage_multiplier) : base;
}

// Unique basic spawn
function onUniqueBasicSpawn(proj){
  proj.scale *= 1.35;
  proj.knockback = { force: 220, max_targets: rndInt(3,5), vsBoss:false };
  proj.homing.enabled = true; proj.homing.turn_deg_per_s = 280;
  proj.addStatusOnHit('atk_down', 5.0);
  if (DMG_OVR) proj.setDamageRng(100,230);
}

// A1 melee-only
function A1_basicFire(){ A1.playMeleeCombo(); } // no gun
function A1_onSwing(i){
  openReflectWindow(1.0, rndInt(2,6));
  if (i>=4) spawnProjectile('a1_sword_wave_mid');
}

// Missy pistol dizzy
function onMissyPistolHit(target){
  if (!target.isBoss) applyStatus(target, 'dizzy', 5.0);
  if (DMG_OVR) applyDamage(target, rndInt(40,100));
}

// Missy Wall S2
function Missy_S2(){
  const wall = spawnEntity('missy_wall', {hp:2000, ttl_s:10});
  redirectEnemyTargetsTo(wall);
  showWallHPBar(wall);
}

// Center-line clamp
function clampEnemy(e){
  if (e.pos.x < CENTER_X){ e.pos.x = CENTER_X; e.vel.x = Math.max(0,e.vel.x); }
}

// Ally AI item use
function aiMaybeUseItem(ally){
  if (ally.hp <= ally.hpMax * 0.35 && hasConsumable('hp_pack')){
    useItem('hp_pack'); toast(`${ally.name} used HP Kit`);
  }
}

// Game over gating
if (allThreeDead()) { showGameOver(); stopStageAutoStart(); }
