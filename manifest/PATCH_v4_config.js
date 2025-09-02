// === PATCH v4 CONFIG ===
PATCH.v4 = {
  ui: { showLevelOverheads:true },
  boss: { preferredDist:[240,300], fireRange:540 },
  fire: { mobCD:[900,1600], bossCD:[700,1200] },   // ms cooldown ranges
  loot: { killGoldMul:1.6, killSilverMul:1.8, giftChanceBonus:0.05 },
  inv:  { bagSlots:48, slots:["weapon","armor","acc1","acc2","pet1","pet2"] },
  pets: {
    ranks:{ S:{atk:12,def:12,haste:8}, A:{atk:9,def:9,haste:6}, B:{atk:6,def:6,haste:4}, C:{atk:3,def:3,haste:2} },
    fireCD:[1400,2200], dmg:[6,12]
  },
  power: { skillMul:1.25, rangeMul:1.20, apSkillPerPoint:0.01 },
  rules: { mobsHoming:false, elitesHoming:true }
};
// === END PATCH v4 CONFIG ===
