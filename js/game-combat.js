// Game Combat System - Combat Engine, Skills, Projectiles, and Combat Mechanics
// This module handles all combat-related systems including skills, projectiles, combos, rage, etc.

// 18.1 Status Effect Engine
class StatusEffectSystem {
    constructor() {
        this.activeEffects = new Map(); // entityUUID -> [effects]
    }

    applyStatus(target, status, duration) {
        if (!target) return;

        // Get UUID from target (support both target.uuid and target.model.uuid)
        const uuid = target.uuid || (target.model && target.model.uuid);
        if (!uuid) return;

        if (!this.activeEffects.has(uuid)) {
            this.activeEffects.set(uuid, []);
        }

        const effects = this.activeEffects.get(uuid);
        const existing = effects.find(e => e.type === status);

        if (existing) {
            existing.duration = duration; // Refresh
        } else {
            effects.push({ type: status, duration: duration });

            // Visual Indicator
            if (window.createFloater && target.model) {
                const color = this.getStatusColor(status);
                window.createFloater(`+${status.toUpperCase()}`, target.model.position, color);
            }
        }
    }

    getStatusColor(status) {
        switch(status) {
            case 'wet': return '#0000ff';
            case 'burn': return '#ff4400';
            case 'frozen': return '#00ffff';
            case 'conductive': return '#ffff00';
            default: return '#ffffff';
        }
    }

    update(dt) {
        this.activeEffects.forEach((effects, uuid) => {
            for (let i = effects.length - 1; i >= 0; i--) {
                effects[i].duration -= dt;
                if (effects[i].duration <= 0) {
                    effects.splice(i, 1); // Remove expired
                }
            }
            // Clean up empty arrays
            if (effects.length === 0) {
                this.activeEffects.delete(uuid);
            }
        });
    }

    hasStatus(target, status) {
        if (!target) return false;
        // Get UUID from target (support both target.uuid and target.model.uuid)
        const uuid = target.uuid || (target.model && target.model.uuid);
        if (!uuid) return false;
        const effects = this.activeEffects.get(uuid);
        return effects && effects.some(e => e.type === status);
    }

    getStatuses(target) {
        if (!target) return [];
        // Get UUID from target (support both target.uuid and target.model.uuid)
        const uuid = target.uuid || (target.model && target.model.uuid);
        if (!uuid) return [];
        return this.activeEffects.get(uuid) || [];
    }
}

// Initialize Global Status System
window.StatusSystem = new StatusEffectSystem();

// Skill Database - All character skills
const SKILL_DATABASE = [
    // A1 Skills (10)
    { id: 'A1_S1', name: 'Crimson Slash', characterId: 'A1', slot: 1, damage: 150, cooldown: 2.5, unlock: 1, element: 'PHYSICAL', description: '3-hit crimson X-wave slash', icon: '⚔️', tier: 'starter' },
    { id: 'A1_S2', name: 'Shadow Clone', characterId: 'A1', slot: 2, damage: 0, cooldown: 15, unlock: 20, element: 'SUMMON', description: 'Summon combat clone ally', icon: '👥', tier: 'common', hp: 500, atk: 30, speed: 8, ai: 'mimic_x' },
    { id: 'A1_S3', name: 'Power Wave', characterId: 'A1', slot: 3, damage: 250, cooldown: 4, unlock: 1, element: 'PHYSICAL', description: '4-hit power wave combo', icon: '💨', tier: 'starter' },
    { id: 'A1_S4', name: 'Phantom Strike', characterId: 'A1', slot: 4, damage: 320, cooldown: 20, unlock: 30, element: 'SHADOW', description: 'Teleport & execute combo (6 slashes)', icon: '🌙', tier: 'rare' },
    { id: 'A1_S5', name: 'Crimson Cyclone', characterId: 'A1', slot: 5, damage: 300, cooldown: 24, unlock: 40, element: 'PHYSICAL', description: '3-blink aerial spin attack', icon: '🌪️', tier: 'rare' },
    { id: 'A1_X1', name: 'Rift Cutter', characterId: 'A1', slot: 'X', damage: 380, cooldown: 28, unlock: 50, element: 'ARCANE', description: 'Twin dimension rifts (chargeable)', icon: '🌌', tier: 'epic', chargeable: true },
    { id: 'A1_BLADE_DANCE', name: 'Blade Dance', characterId: 'A1', slot: null, damage: 600, cooldown: 6, unlock: 10, element: 'PHYSICAL', description: '5-hit spinning slash attack', icon: '🗡️', tier: 'uncommon' },
    { id: 'A1_CRIMSON_FURY', name: 'Crimson Fury', characterId: 'A1', slot: null, damage: 850, cooldown: 8, unlock: 20, element: 'FIRE', description: 'Rapid burning slashes + explosion', icon: '🔥', tier: 'rare', burn: true },
    { id: 'A1_SHADOW_STEP', name: 'Shadow Step', characterId: 'A1', slot: null, damage: 0, cooldown: 4, unlock: 5, element: 'SHADOW', description: 'Dash with invulnerability frames', icon: '👻', tier: 'common' },
    { id: 'A1_VOID_REAPER', name: 'Void Reaper', characterId: 'A1', slot: null, damage: 1800, cooldown: 16, unlock: 35, element: 'SHADOW', description: 'Death scythe AoE with lifesteal', icon: '💀', tier: 'epic', lifesteal: true },
    // UNIQUE Skills (14)
    { id: 'UNIQUE_S1', name: 'Plasma Blast', characterId: 'UNIQUE', slot: 1, damage: 120, cooldown: 2, unlock: 1, element: 'PLASMA', description: '3-hit plasma bolt barrage', icon: '⚡', tier: 'starter' },
    { id: 'UNIQUE_S2', name: 'Combat Drone', characterId: 'UNIQUE', slot: 2, damage: 0, cooldown: 15, unlock: 20, element: 'SUMMON', description: 'Summon combat drone ally', icon: '🤖', tier: 'common', hp: 300, atk: 20, speed: 5, ai: 'hover_sniper' },
    { id: 'UNIQUE_S3', name: 'Power Beam', characterId: 'UNIQUE', slot: 3, damage: 400, cooldown: 8, unlock: 1, element: 'ENERGY', description: 'Channeled energy beam', icon: '💥', tier: 'starter' },
    { id: 'UNIQUE_S4', name: 'Cryo Rail', characterId: 'UNIQUE', slot: 4, damage: 180, cooldown: 20, unlock: 30, element: 'ICE', description: 'Ice rail beam + 4 cryo rounds', icon: '❄️', tier: 'rare', freeze: true },
    { id: 'UNIQUE_S5', name: 'Ion Drill', characterId: 'UNIQUE', slot: 5, damage: 220, cooldown: 24, unlock: 40, element: 'LIGHTNING', description: 'Steerable ion drill beam', icon: '🌀', tier: 'rare' },
    { id: 'UNIQUE_X1', name: 'Hyper Beam', characterId: 'UNIQUE', slot: 'X', damage: 300, cooldown: 28, unlock: 50, element: 'LIGHTNING', description: 'Massive channeled beam (chargeable)', icon: '🌊', tier: 'epic', chargeable: true, freeze: true },
    { id: 'UNIQUE_ICE_BEAM', name: 'Freeze Ray', characterId: 'UNIQUE', slot: null, damage: 500, cooldown: 7, unlock: 10, element: 'ICE', description: 'Freeze enemies in beam path', icon: '🧊', tier: 'uncommon', freeze: true },
    { id: 'UNIQUE_LIGHTNING_BARRAGE', name: 'Thunder Volley', characterId: 'UNIQUE', slot: null, damage: 400, cooldown: 8, unlock: 12, element: 'LIGHTNING', description: '10-hit lightning chain bolts', icon: '⚡', tier: 'uncommon', chain: true },
    { id: 'UNIQUE_EMP_BLAST', name: 'EMP Blast', characterId: 'UNIQUE', slot: null, damage: 800, cooldown: 12, unlock: 22, element: 'LIGHTNING', description: 'AoE electromagnetic pulse', icon: '💥', tier: 'rare', silence: true, stun: true },
    { id: 'UNIQUE_PLASMA_STORM', name: 'Meteor Strike', characterId: 'UNIQUE', slot: null, damage: 280, cooldown: 18, unlock: 30, element: 'FIRE', description: '12 plasma meteors from orbit', icon: '☄️', tier: 'epic', burn: true },
    { id: 'UNIQUE_ABSOLUTE_ZERO_NOVA', name: 'Absolute Zero', characterId: 'UNIQUE', slot: null, damage: 2400, cooldown: 20, unlock: 38, element: 'ICE', description: 'Massive AoE freeze + shatter', icon: '❄️', tier: 'legendary', freeze: true },
    { id: 'UNIQUE_LASER_BARRAGE', name: 'Laser Barrage', characterId: 'UNIQUE', slot: null, damage: 850, cooldown: 9, unlock: 14, element: 'ENERGY', description: '20-hit laser beam barrage', icon: '💥', tier: 'uncommon' },
    { id: 'UNIQUE_QUANTUM_SHIFT', name: 'Quantum Shift', characterId: 'UNIQUE', slot: null, damage: 0, cooldown: 8, unlock: 16, element: 'ARCANE', description: 'Teleport with damage immunity', icon: '🌀', tier: 'rare' },
    { id: 'UNIQUE_NANO_SWARM', name: 'Nano Swarm', characterId: 'UNIQUE', slot: null, damage: 1100, cooldown: 12, unlock: 20, element: 'PLASMA', description: 'Deploy nano-bot swarm', icon: '🦠', tier: 'rare' },
    // MISSY Skills (14)
    { id: 'MISSY_S1', name: 'Crescent Slash', characterId: 'MISSY', slot: 1, damage: 130, cooldown: 2.5, unlock: 1, element: 'PHYSICAL', description: '3-hit crescent wave attack', icon: '🌙', tier: 'starter' },
    { id: 'MISSY_S2', name: 'Spirit Pet', characterId: 'MISSY', slot: 2, damage: 0, cooldown: 15, unlock: 20, element: 'SUMMON', description: 'Summon loyal pet companion', icon: '🐾', tier: 'common', hp: 400, atk: 25, speed: 10, ai: 'aggressive_tank' },
    { id: 'MISSY_S3', name: 'Rapid Fire', characterId: 'MISSY', slot: 3, damage: 200, cooldown: 4, unlock: 1, element: 'PHYSICAL', description: '4-hit rapid pistol shots', icon: '🔫', tier: 'starter' },
    { id: 'MISSY_S4', name: 'Starlight Rail', characterId: 'MISSY', slot: 4, damage: 180, cooldown: 6, unlock: 30, element: 'LIGHT', description: 'Rail beam + 8 boomerang comets', icon: '💫', tier: 'rare', magnet: true },
    { id: 'MISSY_S5', name: 'Storm Vortex', characterId: 'MISSY', slot: 5, damage: 720, cooldown: 8, unlock: 40, element: 'LIGHT', description: 'Spinning cyclone + shotgun volley', icon: '🌪️', tier: 'rare', magnet: true },
    { id: 'MISSY_X1', name: 'Fortune Cannon', characterId: 'MISSY', slot: 'X', damage: 2800, cooldown: 20, unlock: 50, element: 'LIGHT', description: 'Golden coin mega-beam (chargeable)', icon: '💰', tier: 'epic', chargeable: true, magnet: true },
    { id: 'MISSY_BLADE_STORM', name: 'Blade Tempest', characterId: 'MISSY', slot: null, damage: 550, cooldown: 7, unlock: 11, element: 'PHYSICAL', description: 'Spinning blade + 16 pistol shots', icon: '🗡️', tier: 'uncommon' },
    { id: 'MISSY_LUCKY_STRIKE', name: 'Lucky Strike', characterId: 'MISSY', slot: null, damage: 600, cooldown: 5, unlock: 5, element: 'LIGHT', description: 'High chance double damage + coin', icon: '🍀', tier: 'common', luck: true },
    { id: 'MISSY_JACKPOT_RAIN', name: 'Treasure Rain', characterId: 'MISSY', slot: null, damage: 150, cooldown: 12, unlock: 18, element: 'LIGHT', description: '20 golden exploding coins', icon: '💸', tier: 'rare', luck: true },
    { id: 'MISSY_DEADEYE', name: 'Deadeye Shot', characterId: 'MISSY', slot: null, damage: 2000, cooldown: 14, unlock: 24, element: 'PHYSICAL', description: 'Perfect precision shot (crit)', icon: '🎯', tier: 'rare', crit: true, pierce: true },
    { id: 'MISSY_ANGEL_WINGS', name: 'Angel Wings', characterId: 'MISSY', slot: null, damage: 0, cooldown: 10, unlock: 15, element: 'LIGHT', description: 'Summon angel wings for flight', icon: '🪽', tier: 'rare' },
    { id: 'MISSY_HOLY_NOVA', name: 'Holy Nova', characterId: 'MISSY', slot: null, damage: 950, cooldown: 9, unlock: 13, element: 'LIGHT', description: 'Burst of holy light', icon: '✨', tier: 'uncommon' },
    { id: 'MISSY_CAT_SCRATCH', name: 'Cat Scratch Fury', characterId: 'MISSY', slot: null, damage: 1100, cooldown: 11, unlock: 17, element: 'PHYSICAL', description: 'Rapid claw attacks', icon: '🐾', tier: 'rare' },
    { id: 'MISSY_DIVINE_SHIELD', name: 'Divine Shield', characterId: 'MISSY', slot: null, damage: 0, cooldown: 12, unlock: 19, element: 'LIGHT', description: 'Protective light barrier', icon: '🛡️', tier: 'rare' }
];

// Skill helper functions
function getSkillById(skillId) {
    return SKILL_DATABASE.find(s => s.id === skillId);
}

function getSkillsByCharacter(characterId) {
    return SKILL_DATABASE.filter(s => s.characterId === characterId);
}

function getEquippedSkills(characterId) {
    return SKILL_DATABASE.filter(s =>
        s.characterId === characterId &&
        s.slot !== null
    );
}

// ProjectileManager3D - Manages all projectiles and VFX
class ProjectileManager3D {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.vfxParticles = [];
    }

    spawnProjectile(skillData, sourcePos, targetPos, options = {}) {
        const direction = targetPos.clone().sub(sourcePos).normalize();
        const speed = options.speed || 30;
        const color = this.getElementColor(skillData.element);

        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(sourcePos);

        const projectile = {
            mesh: mesh,
            velocity: direction.multiplyScalar(speed),
            damage: skillData.damage,
            element: skillData.element,
            lifetime: 3.0,
            age: 0,
            skillId: skillData.id,
            burn: skillData.burn || false,
            freeze: skillData.freeze || false,
            stun: skillData.stun || false,
            pierce: skillData.pierce || false,
            skillData: skillData // Store full skill data for reaction checks
        };

        this.projectiles.push(projectile);
        this.scene.add(mesh);
        return projectile;
    }

    spawnMultiHit(skillData, sourcePos, targetPos, hitCount) {
        for (let i = 0; i < hitCount; i++) {
            setTimeout(() => {
                const spread = (i - (hitCount - 1) / 2) * 0.2;
                const direction = targetPos.clone().sub(sourcePos).normalize();
                const angle = Math.atan2(direction.z, direction.x) + spread;
                const spreadTarget = sourcePos.clone().add(new THREE.Vector3(Math.cos(angle) * 10, 0, Math.sin(angle) * 10));
                this.spawnProjectile(skillData, sourcePos, spreadTarget, { speed: 30 + i * 2 });
            }, i * 100);
        }
    }

    spawnBeam(skillData, sourcePos, targetPos, duration = 1000) {
        const direction = targetPos.clone().sub(sourcePos).normalize();
        const length = sourcePos.distanceTo(targetPos);

        const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.getElementColor(skillData.element),
            emissive: this.getElementColor(skillData.element),
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(sourcePos.clone().add(targetPos).multiplyScalar(0.5));
        mesh.lookAt(targetPos);
        mesh.rotateX(Math.PI / 2);

        const beam = {
            mesh: mesh,
            damage: skillData.damage,
            element: skillData.element,
            lifetime: duration / 1000,
            age: 0,
            skillId: skillData.id
        };

        this.projectiles.push(beam);
        this.scene.add(mesh);
        return beam;
    }

    spawnExplosion(skillData, pos, radius = 5) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.getElementColor(skillData.element),
            emissive: this.getElementColor(skillData.element),
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);

        const explosion = {
            mesh: mesh,
            damage: skillData.damage,
            element: skillData.element,
            radius: radius,
            maxRadius: radius,
            lifetime: 0.5,
            age: 0,
            skillId: skillData.id,
            dealDamage: true
        };

        this.projectiles.push(explosion);
        this.scene.add(mesh);
        return explosion;
    }

    spawnSwordSlash(characterId, pos, angle, color, radius, damage, delay = 0) {
        setTimeout(() => {
            const targetPos = pos.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
            const skillData = {
                id: `${characterId}_SWORD_SLASH`,
                damage: damage,
                element: 'PHYSICAL'
            };
            this.spawnProjectile(skillData, pos, targetPos, { speed: 30 });
        }, delay * 1000);
    }

    spawnPistolShot(pos, targetPos, damage, homing, speed, delay = 0) {
        setTimeout(() => {
            const skillData = {
                id: 'MISSY_PISTOL_SHOT',
                damage: damage,
                element: 'PHYSICAL'
            };
            this.spawnProjectile(skillData, pos, targetPos, { speed: speed / 60 });
        }, delay * 1000);
    }

    spawnBurstShot(pos, targetPos, damage, pierce, speed, spread, delay = 0) {
        setTimeout(() => {
            const skillData = {
                id: 'UNIQUE_BURST_SHOT',
                damage: damage,
                element: 'PLASMA',
                pierce: pierce
            };
            this.spawnProjectile(skillData, pos, targetPos, { speed: speed / 60 });
        }, delay * 1000);
    }

    getElementColor(element) {
        const colors = {
            PHYSICAL: 0xffffff,
            FIRE: 0xff4400,
            ICE: 0x00ddff,
            LIGHTNING: 0xffff00,
            SHADOW: 0xaa00ff,
            LIGHT: 0xffee00,
            PLASMA: 0x00ff88,
            ENERGY: 0x00aaff,
            ARCANE: 0xff00ff,
            SUMMON: 0x88ff88
        };
        return colors[element] || 0xffffff;
    }

    update(dt, enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.age += dt;

            if (proj.age >= proj.lifetime) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            if (proj.velocity) {
                proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
            }

            if (proj.type === 'explosion') {
                const progress = proj.age / proj.lifetime;
                proj.mesh.scale.setScalar(0.3 + progress * 0.7);
                proj.mesh.material.opacity = (1.0 - progress) * 0.6;
            }

            // Check collisions with enemies
            if (enemies && proj.damage) {
                for (const enemy of enemies) {
                    if (!enemy.isDead && enemy.model) {
                        const dist = proj.mesh.position.distanceTo(enemy.model.position);
                        if (dist < 1.5) {
                            // Use CombatEngine's processHit for elemental reactions
                            if (window.combatEngine && proj.skillData) {
                                window.combatEngine.processHit(enemy, proj.skillData);
                            } else {
                                // Fallback to direct damage
                                if (typeof enemy.takeDamage === 'function') {
                                    enemy.takeDamage(proj.damage, null);
                                }
                            }

                            // Apply status effects
                            if (proj.burn && window.StatusSystem) window.StatusSystem.applyStatus(enemy, 'burn', 3.0);
                            if (proj.freeze && window.StatusSystem) {
                                window.StatusSystem.applyStatus(enemy, 'frozen', 2.0);
                                if (enemy.frozen !== undefined) enemy.frozen = 2000;
                            }
                            if (proj.stun && enemy.stunned !== undefined) enemy.stunned = 1000;

                            if (!proj.pierce) {
                                this.scene.remove(proj.mesh);
                                this.projectiles.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }

            // Check collisions with destructible objects
            if (window.EnvSystem && window.EnvSystem.objects && proj.damage) {
                for (const obj of window.EnvSystem.objects) {
                    if (obj.userData && obj.userData.isDestructible && obj.userData.hp > 0) {
                        const dist = proj.mesh.position.distanceTo(obj.position);
                        const objSize = Math.max(obj.userData.scale.x, obj.userData.scale.z) / 2;
                        if (dist < objSize + 1) {
                            window.EnvSystem.damage(obj, proj.damage);

                            if (!proj.pierce) {
                                this.scene.remove(proj.mesh);
                                this.projectiles.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    clear() {
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles = [];
        this.vfxParticles = [];
    }
}

// SkillExecutor3D - Executes skills and manages cooldowns
class SkillExecutor3D {
    constructor(projectileManager) {
        this.projectileManager = projectileManager;
        this.cooldowns = {};
        this.chargeState = {
            active: false,
            skillId: null,
            startTime: 0,
            maxCharge: 3.0
        };
    }

    executeSkill(skillId, sourcePos, targetPos, characterState) {
        const skill = getSkillById(skillId);
        if (!skill) {
            console.warn(`Skill ${skillId} not found`);
            return false;
        }

        if (this.isOnCooldown(skillId)) {
            console.log(`Skill ${skill.name} is on cooldown`);
            return false;
        }

        // Handle summon skills (clone, minion, etc.)
        if (skill.element === 'SUMMON' && typeof window.spawnAnimeMinion === 'function') {
            const owner = window.party && window.party[0] ? window.party[0] : null;
            if (owner) {
                window.spawnAnimeMinion(owner, skill, owner);
                this.startCooldown(skillId, skill.cooldown * 1000);
                return true;
            }
        }

        // Apply charge multiplier if skill is chargeable and was charged
        let damageMultiplier = 1.0;
        if (skill.chargeable && characterState && characterState.chargeState && characterState.chargeState.active) {
            const chargeTime = (Date.now() - characterState.chargeState.startTime) / 1000;
            const chargePct = Math.min(1.0, chargeTime / characterState.chargeState.maxCharge);
            damageMultiplier = 1.0 + (chargePct * 2.0); // Up to 3x damage at full charge

            // Reset charge state
            characterState.chargeState.active = false;
            characterState.chargeState.skillId = null;
        }

        // Create modified skill data with charge multiplier
        const modifiedSkill = { ...skill };
        modifiedSkill.damage = Math.floor(skill.damage * damageMultiplier);

        this.executeSkillPattern(modifiedSkill, sourcePos, targetPos, characterState);
        this.startCooldown(skillId, skill.cooldown * 1000);

        // Track last skill for clone mimicry
        if (window.party && window.party[0] && window.party[0].userData) {
            window.party[0].userData.lastSkill = skillId;
        }

        if (window.combatEvents) {
            window.combatEvents.dispatchEvent(new CustomEvent('skillUsed', {
                detail: { skill: modifiedSkill, sourcePos, targetPos, chargeMultiplier: damageMultiplier }
            }));
        }

        return true;
    }

    startCharge(skillId) {
        if (this.isOnCooldown(skillId)) return false;

        const skill = getSkillById(skillId);
        if (!skill || !skill.chargeable) return false;

        this.chargeState.active = true;
        this.chargeState.skillId = skillId;
        this.chargeState.startTime = Date.now();
        return true;
    }

    getChargeLevel() {
        if (!this.chargeState.active) return 0;
        const chargeTime = (Date.now() - this.chargeState.startTime) / 1000;
        return Math.min(1.0, chargeTime / this.chargeState.maxCharge);
    }

    cancelCharge() {
        this.chargeState.active = false;
        this.chargeState.skillId = null;
    }

    executeSkillPattern(skill, sourcePos, targetPos, characterState) {
        const desc = skill.description.toLowerCase();

        // Apply combo multiplier to damage
        if (characterState && typeof characterState.getComboDamage === 'function') {
            skill.damage = characterState.getComboDamage(skill.damage);
        }

        if (desc.includes('3-hit') || desc.includes('triple')) {
            this.projectileManager.spawnMultiHit(skill, sourcePos, targetPos, 3);
        } else if (desc.includes('4-hit')) {
            this.projectileManager.spawnMultiHit(skill, sourcePos, targetPos, 4);
        } else if (desc.includes('5-hit')) {
            this.projectileManager.spawnMultiHit(skill, sourcePos, targetPos, 5);
        } else if (desc.includes('beam') || desc.includes('channeled') || desc.includes('rail')) {
            this.projectileManager.spawnBeam(skill, sourcePos, targetPos, 1000);
        } else if (desc.includes('explosion') || desc.includes('nova') || desc.includes('blast')) {
            this.projectileManager.spawnExplosion(skill, targetPos, 5);
        } else {
            this.projectileManager.spawnProjectile(skill, sourcePos, targetPos);
        }
    }

    executeBasicAttack(characterId, sourcePos, targetPos, rageActive = false, comboMultiplier = 1.0) {
        const basicAttackId = `${characterId}_BASIC_ATK`;
        if (this.isOnCooldown(basicAttackId)) {
            return false;
        }

        const baseDamage = rageActive ? 200 : 100;
        const damage = Math.floor(baseDamage * comboMultiplier);

        // Determine element based on character (can be extended)
        let element = 'PHYSICAL';
        if (characterId === 'UNIQUE') element = 'PLASMA';
        else if (characterId === 'MISSY') element = 'LIGHT';

        const skillData = {
            id: basicAttackId,
            damage: damage,
            element: element
        };

        if (characterId === 'A1') {
            const hitCount = rageActive ? 10 : 5;
            for (let i = 0; i < hitCount; i++) {
                const angle = Math.atan2(targetPos.z - sourcePos.z, targetPos.x - sourcePos.x) + ((i % 2 === 0) ? -0.5 : 0.5);
                const color = i % 2 === 0 ? 0xff0000 : 0xffffff;
                this.projectileManager.spawnSwordSlash('A1', sourcePos, angle, color, 5, Math.floor(100 * comboMultiplier), i * 0.1);
            }
        } else if (characterId === 'MISSY') {
            for (let i = 0; i < 2; i++) {
                const angle = Math.atan2(targetPos.z - sourcePos.z, targetPos.x - sourcePos.x) + ((i % 2 === 0) ? -0.4 : 0.4);
                const color = i === 0 ? 0xFFD700 : 0x00FFFF;
                this.projectileManager.spawnSwordSlash('MISSY', sourcePos, angle, color, 5, Math.floor(65 * comboMultiplier), i * 0.1);
            }
            for (let i = 0; i < (rageActive ? 4 : 2); i++) {
                this.projectileManager.spawnPistolShot(sourcePos, targetPos, Math.floor(85 * comboMultiplier), 8 + i, 720, 0.12 + i * 0.12);
            }
        } else if (characterId === 'UNIQUE') {
            for (let i = 0; i < (rageActive ? 3 : 2); i++) {
                this.projectileManager.spawnBurstShot(sourcePos, targetPos, Math.floor(115 * comboMultiplier), rageActive ? 6 : 4, 875, 0, i * 0.08);
            }
        }

        this.startCooldown(basicAttackId, 500);

        if (window.combatEvents) {
            window.combatEvents.dispatchEvent(new CustomEvent('basicAttack', {
                detail: { characterId, sourcePos, targetPos, comboMultiplier }
            }));
        }

        return true;
    }

    isOnCooldown(skillId) {
        const cd = this.cooldowns[skillId];
        if (!cd) return false;
        return Date.now() < cd.endTime;
    }

    getCooldownRemaining(skillId) {
        const cd = this.cooldowns[skillId];
        if (!cd) return 0;
        const remaining = cd.endTime - Date.now();
        return Math.max(0, remaining / 1000);
    }

    getCooldownProgress(skillId) {
        const cd = this.cooldowns[skillId];
        if (!cd) return 1.0;
        const elapsed = Date.now() - cd.startTime;
        const duration = cd.endTime - cd.startTime;
        return Math.min(1.0, elapsed / duration);
    }

    startCooldown(skillId, durationMs) {
        this.cooldowns[skillId] = {
            startTime: Date.now(),
            endTime: Date.now() + durationMs
        };
    }

    resetCooldowns() {
        this.cooldowns = {};
    }

    update() {
        const now = Date.now();
        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId].endTime < now) {
                delete this.cooldowns[skillId];
            }
        }
    }
}

// CombatEngine3D - Main combat engine
class CombatEngine3D {
    constructor(scene) {
        this.scene = scene;
        this.activeCharacter = 'A1';
        this.currentHP = 900;
        this.maxHP = 900;
        this.rage = 0;
        this.rageActive = false;
        this.combo = 0;
        this.lastHitTime = 0;
        this.comboBreakDelay = 2000;

        this.characters = {
            A1: { id: 'A1', name: 'A1', maxHP: 1000, attackPower: 1.0 },
            UNIQUE: { id: 'UNIQUE', name: 'Unique', maxHP: 900, attackPower: 1.2 },
            MISSY: { id: 'MISSY', name: 'Missy', maxHP: 850, attackPower: 1.3 }
        };

        this.projectileManager = new ProjectileManager3D(scene);
        this.skillExecutor = new SkillExecutor3D(this.projectileManager);

        // Charge system
        this.chargeState = {
            active: false,
            skillId: null,
            startTime: 0,
            maxCharge: 3.0,
            multiplier: 1.0
        };

        if (!window.combatEvents) {
            window.combatEvents = new EventTarget();
        }

        window.combatEvents.addEventListener('damageDealt', (e) => {
            this.onDamageDealt(e.detail);
        });
    }

    onDamageDealt(detail) {
        if (this.activeCharacter === 'UNIQUE') {
            if (!this.styleMeter) this.styleMeter = 0;
            this.styleMeter = Math.min(100, this.styleMeter + 2);
        } else {
            this.addRage(2);
        }

        this.combo++;
        this.lastHitTime = Date.now();
        this.checkComboAchievements();

        // Track limit break damage
        if (detail.damage && typeof window.trackLimitBreakDamage === 'function') {
            window.trackLimitBreakDamage(detail.damage);
        }
    }

    checkComboAchievements() {
        if (this.combo === 10) {
            console.log('🏆 COMBO STARTER - 10 hit combo!');
            if (typeof window.screenShake === 'function') window.screenShake(0.2);
        }
        if (this.combo === 50) {
            console.log('🏆 COMBO MASTER - 50 hit combo!');
            if (typeof window.screenShake === 'function') window.screenShake(0.4);
        }
        if (this.combo === 100) {
            console.log('🏆 COMBO GOD - 100 hit combo!');
            if (typeof window.screenShake === 'function') window.screenShake(0.6);
        }
    }

    getComboMultiplier() {
        return 1.0 + (Math.min(this.combo, 100) / 100);
    }

    getComboDamage(damage) {
        return Math.floor(damage * this.getComboMultiplier());
    }

    activateSkill(skillId, sourcePos, targetPos) {
        return this.skillExecutor.executeSkill(skillId, sourcePos, targetPos, this);
    }

    startChargeSkill(skillId) {
        return this.skillExecutor.startCharge(skillId);
    }

    getChargeLevel() {
        return this.skillExecutor.getChargeLevel();
    }

    cancelChargeSkill() {
        this.skillExecutor.cancelCharge();
    }

    basicAttack(sourcePos, targetPos) {
        const comboMultiplier = this.getComboMultiplier();
        return this.skillExecutor.executeBasicAttack(this.activeCharacter, sourcePos, targetPos, this.rageActive, comboMultiplier);
    }

    activateRage() {
        if (this.rage < 100) {
            console.log('Not enough rage');
            return false;
        }
        this.rageActive = true;
        this.rage = 100;
        this.rageEndTime = Date.now() + 10000;

        // Visual effects
        if (typeof window.screenShake === 'function') window.screenShake(0.5);

        // Create rage aura effect
        if (window.party && window.party[0] && window.party[0].model && window.Game && window.Game.scene) {
            const player = window.party[0];
            const aura = new THREE.Mesh(
                new THREE.SphereGeometry(2, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                })
            );
            aura.position.copy(player.model.position);
            aura.position.y = 1;
            window.Game.scene.add(aura);

            // Animate aura
            let scale = 1;
            const auraAnim = () => {
                if (!this.rageActive) {
                    window.Game.scene.remove(aura);
                    return;
                }
                scale += 0.02;
                aura.scale.setScalar(scale);
                aura.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                requestAnimationFrame(auraAnim);
            };
            auraAnim();
        }

        setTimeout(() => {
            this.rageActive = false;
            this.rage = 0;
        }, 10000);
        return true;
    }

    addRage(amount) {
        this.rage = Math.min(100, this.rage + amount);
    }

    // 18.2 Elemental Reaction Logic
    checkElementalReaction(target, attackElement, damage) {
        if (!target) return { damage: damage, reaction: null };

        let finalDamage = damage;
        let reaction = null;
        let isCritical = false;

        // REACTION: ELECTRO-CHARGED (Lightning + Wet) -> 2x damage + AoE shock
        if (attackElement === 'LIGHTNING' && window.StatusSystem.hasStatus(target, 'wet')) {
            finalDamage *= 2.0;
            reaction = "ELECTRO-CHARGED!";

            // Chain Lightning Logic (AoE) - shock nearby enemies
            if (window.enemies) {
                window.enemies.forEach(e => {
                    if (e !== target && e.model && !e.isDead && e.model.position.distanceTo(target.model.position) < 5) {
                        if (typeof e.takeDamage === 'function') {
                            e.takeDamage(damage * 0.5);
                        }
                        // Apply conductive status for chain reactions
                        if (window.StatusSystem) {
                            window.StatusSystem.applyStatus(e, 'conductive', 2.0);
                        }
                        if (window.createFloater) window.createFloater("CHAIN!", e.model.position, "#ffff00");
                    }
                });
            }
            // Remove wet status after reaction
            if (window.StatusSystem) {
                const uuid = target.uuid || (target.model && target.model.uuid);
                if (uuid) {
                    const effects = window.StatusSystem.activeEffects.get(uuid);
                    if (effects) {
                        const wetIndex = effects.findIndex(e => e.type === 'wet');
                        if (wetIndex >= 0) effects.splice(wetIndex, 1);
                    }
                }
            }
        }

        // REACTION: VAPORIZE (Fire + Wet) -> 1.5x damage
        else if (attackElement === 'FIRE' && window.StatusSystem.hasStatus(target, 'wet')) {
            finalDamage *= 1.5;
            reaction = "VAPORIZE!";
            // Remove wet status after reaction
            if (window.StatusSystem) {
                const uuid = target.uuid || (target.model && target.model.uuid);
                if (uuid) {
                    const effects = window.StatusSystem.activeEffects.get(uuid);
                    if (effects) {
                        const wetIndex = effects.findIndex(e => e.type === 'wet');
                        if (wetIndex >= 0) effects.splice(wetIndex, 1);
                    }
                }
            }
        }

        // REACTION: SHATTER (Physical + Frozen) -> Crit + remove freeze
        else if (attackElement === 'PHYSICAL' && window.StatusSystem.hasStatus(target, 'frozen')) {
            finalDamage *= 2.0; // Critical damage
            isCritical = true;
            reaction = "SHATTER!";
            // Remove frozen status
            if (window.StatusSystem) {
                const uuid = target.uuid || (target.model && target.model.uuid);
                if (uuid) {
                    const effects = window.StatusSystem.activeEffects.get(uuid);
                    if (effects) {
                        const frozenIndex = effects.findIndex(e => e.type === 'frozen');
                        if (frozenIndex >= 0) effects.splice(frozenIndex, 1);
                    }
                }
            }
            if (target.frozen !== undefined) target.frozen = false;
        }

        // REACTION: STEAM (Water + Burn) -> Create fog cloud (blindness)
        else if (attackElement === 'WATER' && window.StatusSystem.hasStatus(target, 'burn')) {
            reaction = "STEAM!";
            // Remove burn status
            if (window.StatusSystem) {
                const uuid = target.uuid || (target.model && target.model.uuid);
                if (uuid) {
                    const effects = window.StatusSystem.activeEffects.get(uuid);
                    if (effects) {
                        const burnIndex = effects.findIndex(e => e.type === 'burn');
                        if (burnIndex >= 0) effects.splice(burnIndex, 1);
                    }
                }
            }
            // Create fog cloud effect (blindness - reduce enemy accuracy/vision)
            if (target.model && window.Game && window.Game.scene) {
                const fogCloud = new THREE.Mesh(
                    new THREE.SphereGeometry(3, 16, 16),
                    new THREE.MeshBasicMaterial({
                        color: 0xcccccc,
                        transparent: true,
                        opacity: 0.3,
                        side: THREE.DoubleSide
                    })
                );
                fogCloud.position.copy(target.model.position);
                fogCloud.position.y = 1.5;
                window.Game.scene.add(fogCloud);

                // Animate and remove fog cloud
                let fogLife = 3.0;
                const fogAnim = () => {
                    fogLife -= 0.05;
                    if (fogLife > 0) {
                        fogCloud.material.opacity = Math.max(0, fogLife / 3.0 * 0.3);
                        fogCloud.scale.setScalar(1 + (3.0 - fogLife) * 0.2);
                        requestAnimationFrame(fogAnim);
                    } else {
                        window.Game.scene.remove(fogCloud);
                    }
                };
                fogAnim();

                // Apply blindness effect (reduce accuracy/aggro range)
                if (target.aggroRange !== undefined) {
                    const originalAggro = target.aggroRange;
                    target.aggroRange = originalAggro * 0.5;
                    setTimeout(() => {
                        if (target.aggroRange !== undefined) {
                            target.aggroRange = originalAggro;
                        }
                    }, 3000);
                }
            }
        }

        // REACTION: MELT (Fire + Frozen) -> 2x damage
        else if (attackElement === 'FIRE' && window.StatusSystem.hasStatus(target, 'frozen')) {
            finalDamage *= 2.0;
            reaction = "MELT!";
            // Remove frozen status
            if (window.StatusSystem) {
                const uuid = target.uuid || (target.model && target.model.uuid);
                if (uuid) {
                    const effects = window.StatusSystem.activeEffects.get(uuid);
                    if (effects) {
                        const frozenIndex = effects.findIndex(e => e.type === 'frozen');
                        if (frozenIndex >= 0) effects.splice(frozenIndex, 1);
                    }
                }
            }
            if (target.frozen !== undefined) target.frozen = false;
        }

        // REACTION: FREEZE (Ice + Wet)
        else if (attackElement === 'ICE' && window.StatusSystem.hasStatus(target, 'wet')) {
            if (target.frozen !== undefined) target.frozen = true;
            reaction = "FROZEN!";
            window.StatusSystem.applyStatus(target, 'frozen', 3.0);
        }

        // Apply Status based on Element (if no reaction occurred)
        if (!reaction) {
            if (attackElement === 'WATER') window.StatusSystem.applyStatus(target, 'wet', 5.0);
            if (attackElement === 'FIRE') window.StatusSystem.applyStatus(target, 'burn', 3.0);
            if (attackElement === 'ICE') window.StatusSystem.applyStatus(target, 'frozen', 2.0);
            if (attackElement === 'LIGHTNING') window.StatusSystem.applyStatus(target, 'conductive', 2.0);
        }

        return { damage: finalDamage, reaction: reaction, isCritical: isCritical };
    }

    // Process hit with elemental reactions
    processHit(target, skillData) {
        if (!target || !skillData) return;

        // 1. Calculate Base Damage
        let dmg = skillData.damage || 100;

        // 2. Check Elemental Reaction
        const element = skillData.element || 'PHYSICAL';
        const reactionResult = this.checkElementalReaction(target, element, dmg);
        dmg = reactionResult.damage;

        // 3. Apply Damage
        if (typeof target.takeDamage === 'function') {
            target.takeDamage(dmg);
        }

        // 4. Visual Feedback (Phase 18.3) - Show reaction floaters
        if (reactionResult.reaction && target.model) {
            // Determine color based on reaction type
            let color = '#ffff00'; // Default yellow
            if (reactionResult.reaction === 'ELECTRO-CHARGED!') color = '#ffff00'; // Yellow
            else if (reactionResult.reaction === 'VAPORIZE!') color = '#ff8844'; // Orange
            else if (reactionResult.reaction === 'SHATTER!') color = '#00ffff'; // Cyan
            else if (reactionResult.reaction === 'STEAM!') color = '#cccccc'; // Gray
            else if (reactionResult.reaction === 'MELT!') color = '#ff4400'; // Red
            else if (reactionResult.reaction === 'FROZEN!') color = '#00ddff'; // Light blue

            if (window.createFloater) {
                window.createFloater(reactionResult.reaction, target.model.position, color, {
                    isCritical: reactionResult.isCritical || false
                });
            }

            // Screen shake for major reactions
            if (window.screenShake && (reactionResult.reaction === 'ELECTRO-CHARGED!' || reactionResult.reaction === 'SHATTER!')) {
                window.screenShake(0.4);
            } else if (window.screenShake) {
                window.screenShake(0.2);
            }
        }
    }

    update(dt, enemies) {
        this.skillExecutor.update();
        this.projectileManager.update(dt, enemies);

        if (this.combo > 0 && Date.now() - this.lastHitTime > this.comboBreakDelay) {
            console.log(`Combo broken at ${this.combo} hits`);
            this.combo = 0;
        }
    }

    getEquippedSkills() {
        return getEquippedSkills(this.activeCharacter);
    }

    getSkillCooldown(skillId) {
        return {
            remaining: this.skillExecutor.getCooldownRemaining(skillId),
            progress: this.skillExecutor.getCooldownProgress(skillId),
            isReady: !this.skillExecutor.isOnCooldown(skillId)
        };
    }
}

// Screen shake function
function screenShake(intensity) {
    if (!window.Game || !window.Game.camera) return;

    const originalPos = window.Game.camera.position.clone();
    let currentIntensity = intensity;
    let frames = Math.floor(intensity * 10);
    const totalFrames = frames;

    function shake() {
        if (frames <= 0) {
            window.Game.camera.position.copy(originalPos);
            return;
        }

        const decay = frames / totalFrames;
        const shakeIntensity = currentIntensity * decay;

        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity
        );

        window.Game.camera.position.copy(originalPos);
        window.Game.camera.position.add(offset);

        frames--;
        requestAnimationFrame(shake);
    }
    shake();
}

// Hit stop function
function hitStop(duration) {
    if (!window.Game) return;
    if (window.Game.paused) return;

    window.Game.paused = true;
    const pauseDuration = duration * 1000;

    setTimeout(() => {
        window.Game.paused = false;
    }, pauseDuration);
}

// Create explosion VFX
function createExplosion(pos, color) {
    if (!window.Game || !window.Game.scene) return;

    // Particle burst
    for(let i=0; i<20; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: color || 0xffff00 })
        );
        particle.position.copy(pos);
        const vel = new THREE.Vector3(
            (Math.random()-0.5)*5,
            Math.random()*5,
            (Math.random()-0.5)*5
        );
        window.Game.scene.add(particle);

        let life = 0.5;
        const anim = () => {
            life -= 0.02;
            particle.position.add(vel.clone().multiplyScalar(0.02));
            vel.multiplyScalar(0.95);
            particle.material.opacity = life;
            if(life > 0) {
                requestAnimationFrame(anim);
            } else {
                window.Game.scene.remove(particle);
            }
        };
        anim();
    }

    // Flash ring
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 3, 16),
        new THREE.MeshBasicMaterial({ color: color || 0xffff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    ring.position.copy(pos);
    ring.rotation.x = -Math.PI/2;
    window.Game.scene.add(ring);

    let scale = 1;
    const ringAnim = () => {
        scale += 0.1;
        ring.scale.setScalar(scale);
        ring.material.opacity -= 0.05;
        if(ring.material.opacity > 0) {
            requestAnimationFrame(ringAnim);
        } else {
            window.Game.scene.remove(ring);
        }
    };
    ringAnim();

    if (typeof screenShake === 'function') {
        screenShake(0.3);
    }
}

// Limit Break System
function updateLimitBreakMeter(dt) {
    if (!window.combatEngine || !window.party || !window.party[0]) return;

    const player = window.party[0];
    if (player.characterId !== 'A1') {
        const limitHud = document.getElementById('limit-break-hud');
        if (limitHud) limitHud.style.display = 'none';
        return;
    }

    const limitHud = document.getElementById('limit-break-hud');
    if (limitHud) limitHud.style.display = 'block';

    if (window.Game.limitBreakMeter > 0 && !window.Game.limitBreakActive) {
        window.Game.limitBreakMeter = Math.max(0, window.Game.limitBreakMeter - dt * 2);
    }

    const limitBar = document.getElementById('limit-break-bar');
    if (limitBar) {
        const pct = (window.Game.limitBreakMeter / window.Game.limitBreakMax) * 100;
        limitBar.style.width = pct + '%';

        if (pct >= 100) {
            limitBar.classList.add('active');
        } else {
            limitBar.classList.remove('active');
        }
    }

    if (window.Game.limitBreakMeter >= window.Game.limitBreakMax && !window.Game.limitBreakActive) {
        activateLimitBreak();
    }
}

function trackLimitBreakDamage(amount) {
    if (!window.combatEngine || !window.party || !window.party[0]) return;
    const player = window.party[0];

    if (player.characterId !== 'A1') return;
    if (window.Game.limitBreakActive) return;

    const gain = Math.min(amount * 0.1, 5);
    window.Game.limitBreakMeter = Math.min(window.Game.limitBreakMax, window.Game.limitBreakMeter + gain);
}

function activateLimitBreak() {
    if (!window.Game || window.Game.limitBreakActive) return;

    window.Game.limitBreakActive = true;
    window.Game.limitBreakMeter = 0;

    if (typeof screenShake === 'function') screenShake(1.0);
    if (typeof hitStop === 'function') hitStop(0.15);

    if (window.party && window.party[0] && window.party[0].model && window.Game && window.Game.scene) {
        const player = window.party[0];

        const explosion = new THREE.Mesh(
            new THREE.SphereGeometry(5, 32, 32),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8,
                emissive: 0xff0000,
                emissiveIntensity: 1.0
            })
        );
        explosion.position.copy(player.model.position);
        explosion.position.y = 1;
        window.Game.scene.add(explosion);

        let scale = 1;
        const anim = () => {
            scale += 0.1;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = Math.max(0, explosion.material.opacity - 0.05);
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(anim);
            } else {
                window.Game.scene.remove(explosion);
            }
        };
        anim();
    }

    if (window.combatEngine) {
        window.combatEngine.rage = 100;
        window.combatEngine.activateRage();
    }

    setTimeout(() => {
        window.Game.limitBreakActive = false;
    }, 15000);
}

// Parry System
if (window.Game) {
    window.Game.parryWindow = false;
    window.Game.parryWindowEndTime = 0;
    window.Game.parryChance = 0.3;
}

function checkPlayerParry(damage, attacker) {
    if (!window.party || !window.party[0]) return false;

    const player = window.party[0];
    const now = Date.now();

    if (!window.Game.parryWindow || now > window.Game.parryWindowEndTime) {
        return false;
    }

    let parryChance = window.Game.parryChance;
    if (player.characterId === 'A1') {
        parryChance = 0.5;
    } else if (player.characterId === 'MISSY') {
        parryChance = 0.2;
    } else if (player.characterId === 'UNIQUE') {
        parryChance = 0.25;
    }

    if (Math.random() < parryChance) {
        if (typeof screenShake === 'function') screenShake(0.3);
        if (typeof hitStop === 'function') hitStop(0.08);

        if (player.model && window.Game && window.Game.scene) {
            const sparkPos = player.model.position.clone().add(new THREE.Vector3(0, 1, 0));
            for (let i = 0; i < 10; i++) {
                const spark = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffff00 })
                );
                spark.position.copy(sparkPos);
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                );
                window.Game.scene.add(spark);

                let life = 0.3;
                const anim = () => {
                    life -= 0.02;
                    spark.position.add(vel.clone().multiplyScalar(0.02));
                    spark.material.opacity = life;
                    if (life > 0) {
                        requestAnimationFrame(anim);
                    } else {
                        window.Game.scene.remove(spark);
                    }
                };
                anim();
            }
        }

        if (attacker && attacker.takeDamage) {
            const counterDamage = damage * 0.5;
            attacker.takeDamage(counterDamage, player);
        }

        return true;
    }

    return false;
}

function enableParryWindow(duration = 0.4) {
    if (window.Game) {
        window.Game.parryWindow = true;
        window.Game.parryWindowEndTime = Date.now() + (duration * 1000);
    }
}

function disableParryWindow() {
    if (window.Game) {
        window.Game.parryWindow = false;
    }
}

// Clone/Minion System
function spawnAnimeMinion(owner, skillData, ownerDef) {
    if (!window.Game || !window.Game.scene || !owner || !owner.model) return null;

    let minionMesh;

    if (skillData.ai === 'hover_sniper') {
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
        );
        minionMesh = new THREE.Group();
        minionMesh.add(body);

        for (let i = 0; i < 4; i++) {
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.3, 0.6),
                new THREE.MeshBasicMaterial({ color: 0x0088ff })
            );
            const angle = (i / 4) * Math.PI * 2;
            wing.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
            minionMesh.add(wing);
        }
    } else if (skillData.ai === 'aggressive_tank') {
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.8, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x654321 })
        );
        head.position.y = 0.6;
        minionMesh = new THREE.Group();
        minionMesh.add(body, head);
    } else {
        minionMesh = owner.model.clone();
        minionMesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.7;
                child.material.emissive = new THREE.Color(0x00ffff);
                child.material.emissiveIntensity = 0.3;
            }
        });
    }

    minionMesh.position.copy(owner.model.position);
    minionMesh.position.x += (Math.random() - 0.5) * 2;
    minionMesh.position.z += (Math.random() - 0.5) * 2;
    if (skillData.ai === 'hover_sniper') {
        minionMesh.position.y = 2.0;
    }

    window.Game.scene.add(minionMesh);

    const barGroup = new THREE.Group();
    const bgBar = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    const fgBar = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    fgBar.position.z = 0.01;
    barGroup.add(bgBar, fgBar);
    barGroup.position.y = 2;
    minionMesh.add(barGroup);

    const clone = {
        mesh: minionMesh,
        healthBar: { bg: bgBar, fg: fgBar },
        data: {
            hp: skillData.hp || 500,
            hpMax: skillData.hp || 500,
            atk: skillData.atk || 30,
            speed: skillData.speed || 8,
            ai: skillData.ai || 'mimic',
            owner: owner,
            spawnTime: Date.now(),
            lastAttack: 0,
            lastSkill: null,
            alive: true
        }
    };

    if (!window.Game.minions) window.Game.minions = [];
    window.Game.minions.push(clone);
    return clone;
}

function updateClones(dt) {
    if (!window.Game || !window.Game.minions || window.Game.minions.length === 0) return;
    if (!window.party || !window.party[0]) return;

    const leader = window.party[0];
    const now = Date.now();

    window.Game.minions = window.Game.minions.filter(clone => {
        if (!clone || !clone.mesh || !clone.data) return false;

        const data = clone.data;
        const mesh = clone.mesh;

        if (clone.healthBar && clone.healthBar.fg) {
            const pct = data.hp / data.hpMax;
            clone.healthBar.fg.scale.x = pct;
            clone.healthBar.fg.position.x = -(1 - pct) / 2;
        }

        if (data.hp <= 0) {
            data.alive = false;
            if (window.particleSystems) {
                const ps = new window.ParticleSystem(mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff0000);
                window.particleSystems.push(ps);
                ps.emit(20);
            }

            mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = Math.max(0, child.material.opacity - dt * 2);
                }
            });
            if (mesh.material && mesh.material.opacity <= 0) {
                window.Game.scene.remove(mesh);
                return false;
            }
            return true;
        }

        let nearestEnemy = null;
        let minDist = Infinity;
        if (window.enemies) {
            window.enemies.forEach(e => {
                if (!e.isDead && e.model) {
                    const dist = mesh.position.distanceTo(e.model.position);
                    if (dist < minDist && dist < 15) {
                        minDist = dist;
                        nearestEnemy = e;
                    }
                }
            });
        }

        if (data.ai === 'mimic' || data.ai === 'mimic_x') {
            if (nearestEnemy) {
                const dir = new THREE.Vector3().subVectors(nearestEnemy.model.position, mesh.position).normalize();
                mesh.position.add(dir.multiplyScalar(data.speed * dt));
                mesh.lookAt(nearestEnemy.model.position);

                if (minDist < 4 && now - data.lastAttack > 1000) {
                    data.lastAttack = now;
                    nearestEnemy.takeDamage(data.atk);

                    if (leader.userData && leader.userData.lastSkill && window.combatEngine) {
                        const skillId = leader.userData.lastSkill;
                        const sourcePos = mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                        const targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));

                        const prevActive = window.combatEngine.activeCharacter;
                        window.combatEngine.activeCharacter = leader.characterId;
                        window.combatEngine.activateSkill(skillId, sourcePos, targetPos);
                        window.combatEngine.activeCharacter = prevActive;
                    }
                }
            } else if (data.owner && data.owner.model) {
                const dir = new THREE.Vector3().subVectors(data.owner.model.position, mesh.position).normalize();
                mesh.position.add(dir.multiplyScalar(data.speed * dt * 0.5));
            }
        } else if (data.ai === 'hover_sniper') {
            const floatTime = now * 0.001;
            if (data.owner && data.owner.model) {
                if (!data.floatOffset) {
                    data.floatOffset = Math.random() * Math.PI * 2;
                }

                const angle = floatTime + data.floatOffset;
                const radius = 3.0;
                const targetPos = data.owner.model.position.clone();
                targetPos.x += Math.cos(angle) * radius;
                targetPos.z += Math.sin(angle) * radius;
                targetPos.y = 2.0 + Math.sin(floatTime * 2) * 0.3;

                mesh.position.lerp(targetPos, 0.05);
                mesh.lookAt(data.owner.model.position);

                if (nearestEnemy && minDist < 12 && now - data.lastAttack > 1500) {
                    const laserDir = nearestEnemy.model.position.clone().sub(mesh.position).normalize();
                    const laser = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.1, minDist, 8),
                        new THREE.MeshBasicMaterial({ color: 0x00ffff })
                    );
                    laser.position.copy(mesh.position).add(laserDir.clone().multiplyScalar(minDist / 2));
                    laser.lookAt(nearestEnemy.model.position);
                    window.Game.scene.add(laser);
                    setTimeout(() => window.Game.scene.remove(laser), 200);

                    nearestEnemy.takeDamage(data.atk);
                    data.lastAttack = now;
                }
            }
        } else if (data.ai === 'aggressive_tank') {
            if (nearestEnemy) {
                const dir = new THREE.Vector3().subVectors(nearestEnemy.model.position, mesh.position).normalize();
                mesh.position.add(dir.multiplyScalar(data.speed * dt * 1.5));
                mesh.lookAt(nearestEnemy.model.position);

                if (minDist < 3 && now - data.lastAttack > 800) {
                    data.lastAttack = now;
                    nearestEnemy.takeDamage(data.atk * 1.5);
                    if (typeof window.screenShake === 'function') window.screenShake(0.2);
                }
            } else if (data.owner && data.owner.model) {
                const dir = new THREE.Vector3().subVectors(data.owner.model.position, mesh.position).normalize();
                mesh.position.add(dir.multiplyScalar(data.speed * dt * 0.5));
            }
        }

        return true;
    });
}

// Auto Attack System
function updateAutoAttack(dt) {
    if (!window.Game || !window.Game.autoAttack) return;

    const leader = window.party && window.party[0] ? window.party[0] : null;
    if (!leader || !leader.isPlayer) return;

    const groundLevel = 0.6;
    leader.model.position.y = groundLevel;

    let target = null;
    let type = null;
    let minDist = 20;
    const now = Date.now();

    // Collect loot
    if (window.Game && window.Game.scene) {
        window.Game.scene.children.forEach(child => {
            if (child.userData && child.userData.type === 'gold' && !child.userData.collected) {
                const d = leader.model.position.distanceTo(child.position);
                if (d < 3) {
                    child.userData.collected = true;
                    if (window.gameState) {
                        window.gameState.gold = (window.gameState.gold || 0) + (child.userData.value || 10);
                        // Sync currency to bag system
                        if (typeof window.syncCurrencyToBag === 'function') {
                            window.syncCurrencyToBag();
                        }
                    }
                    window.Game.scene.remove(child);
                } else if (d < 30) {
                    const dir = new THREE.Vector3().subVectors(leader.model.position, child.position).normalize();
                    child.position.add(dir.multiplyScalar(15 * dt));
                }
            }
        });
    }

    // Find enemies
    if (window.enemies) {
        window.enemies.forEach(e => {
            if (!e.isDead && e.model) {
                const d = leader.model.position.distanceTo(e.model.position);
                if (d < minDist) {
                    minDist = d;
                    target = e;
                    type = 'enemy';
                }
            }
        });
    }

    if (target) {
        const tPos = type === 'enemy' ? target.model.position : target.position;
        const range = type === 'enemy' ? 4 : 3;

        const targetLook = new THREE.Vector3(tPos.x, leader.model.position.y, tPos.z);
        leader.model.lookAt(targetLook);

        if (minDist > range) {
            const dir = new THREE.Vector3().subVectors(tPos, leader.model.position).normalize();
            const speed = 12 * dt;

            leader.model.position.x += dir.x * speed;
            leader.model.position.z += dir.z * speed;
        } else {
            if (!leader.userData.lastAttackTime) leader.userData.lastAttackTime = 0;
            if (now - leader.userData.lastAttackTime > 400) {
                const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(leader.model.position) : null;
                const sourcePos = leader.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                let targetPos;

                if (nearestEnemy) {
                    targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
                } else {
                    const forward = new THREE.Vector3();
                    leader.model.getWorldDirection(forward);
                    targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
                }

                if (window.combatEngine) {
                    window.combatEngine.activeCharacter = leader.characterId;
                    window.combatEngine.basicAttack(sourcePos, targetPos);
                    if (typeof leader.attack === 'function') leader.attack();
                }

                leader.userData.lastAttackTime = now;
            }
        }
    }

    // Random Auto-Skill Usage
    if (!leader.userData.lastAutoSkillTime) leader.userData.lastAutoSkillTime = 0;
    if (now - leader.userData.lastAutoSkillTime > 10000 && target) {
        const skillKeys = ['S1', 'S2', 'S3'];
        const randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
        if (randomSkill === 'S1') leader.useSkill(1);
        else if (randomSkill === 'S2' && window.party && window.party[1]) window.party[1].useSkill(1);
        else if (randomSkill === 'S3' && window.party && window.party[2]) window.party[2].useSkill(1);
        leader.userData.lastAutoSkillTime = now;
    }
}

// Export to window for global access
window.SKILL_DATABASE = SKILL_DATABASE;
window.getSkillById = getSkillById;
window.getSkillsByCharacter = getSkillsByCharacter;
window.getEquippedSkills = getEquippedSkills;
window.ProjectileManager3D = ProjectileManager3D;
window.SkillExecutor3D = SkillExecutor3D;
window.CombatEngine3D = CombatEngine3D;
window.StatusEffectSystem = StatusEffectSystem;
window.screenShake = screenShake;
window.hitStop = hitStop;
window.createExplosion = createExplosion;
window.updateLimitBreakMeter = updateLimitBreakMeter;
window.trackLimitBreakDamage = trackLimitBreakDamage;
window.activateLimitBreak = activateLimitBreak;
window.checkPlayerParry = checkPlayerParry;
window.enableParryWindow = enableParryWindow;
window.disableParryWindow = disableParryWindow;
window.spawnAnimeMinion = spawnAnimeMinion;
window.updateClones = updateClones;
window.updateAutoAttack = updateAutoAttack;
