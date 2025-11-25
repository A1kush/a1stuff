// Phase 25: World Boss Raids System
const WorldBossSystem = {
    currentBoss: null,
    lastBossSpawn: 0,
    bossSpawnInterval: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
    bossPhase: 1,

    // Phase 25.1: Titan Spawner
    spawnTitan: () => {
        if (!window.Game || !window.Game.scene) return;

        // Check if boss already exists
        if (WorldBossSystem.currentBoss) {
            console.log('[WorldBossSystem] Boss already spawned');
            return;
        }

        // Check cooldown
        const now = Date.now();
        if (now - WorldBossSystem.lastBossSpawn < WorldBossSystem.bossSpawnInterval) {
            const remaining = Math.floor((WorldBossSystem.bossSpawnInterval - (now - WorldBossSystem.lastBossSpawn)) / 1000 / 60);
            console.log(`[WorldBossSystem] Boss spawn cooldown: ${remaining} minutes remaining`);
            return;
        }

        // Spawn boss at center (0,0,0)
        const boss = WorldBossSystem.createTitanBoss();
        WorldBossSystem.currentBoss = boss;
        WorldBossSystem.lastBossSpawn = now;
        WorldBossSystem.bossPhase = 1;

        // Announcement
        if (window.createFloater && window.party && window.party[0]) {
            window.createFloater(
                "⚠️ WORLD BOSS SPAWNED! ⚠️",
                window.party[0].model.position,
                "#ff0000"
            );
        }

        console.log('[WorldBossSystem] Titan boss spawned');
    },

    // Create titan boss (scale x5)
    createTitanBoss: () => {
        if (!window.Game || !window.Game.scene) return null;

        // Use existing enemy spawn but scale up
        const boss = window.spawnAnimeMinion ? window.spawnAnimeMinion(new THREE.Vector3(0, 0, 0)) : null;

        if (boss && boss.model) {
            // Scale x5
            boss.model.scale.setScalar(5.0);

            // Massive HP
            boss.maxHealth = (boss.maxHealth || 1000) * 20;
            boss.health = boss.maxHealth;

            // High attack
            boss.attackPower = (boss.attackPower || 1) * 3;

            // Mark as world boss
            boss.isWorldBoss = true;
            boss.bossId = 'titan_01';
            boss.originalMaxHealth = boss.maxHealth;

            // Quick Feature 5: Enhanced boss visual effects
            // Red glow with pulsing effect
            if (boss.model.material) {
                boss.model.material.emissive = new THREE.Color(0xff0000);
                boss.model.material.emissiveIntensity = 0.8;

                // Pulsing emissive animation
                const pulseEmissive = () => {
                    if (boss.model && boss.model.material && boss.model.material.emissive) {
                        const intensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                        boss.model.material.emissiveIntensity = intensity;
                        requestAnimationFrame(pulseEmissive);
                    }
                };
                pulseEmissive();
            }

            // Boss aura ring
            const auraRing = new THREE.Mesh(
                new THREE.TorusGeometry(3, 0.3, 16, 32),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.6,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                })
            );
            auraRing.rotation.x = Math.PI / 2;
            auraRing.position.y = 0.1;
            boss.model.add(auraRing);
            boss.auraRing = auraRing;

            // Animate aura ring
            const animateAura = () => {
                if (auraRing && auraRing.parent) {
                    auraRing.rotation.z += 0.05;
                    auraRing.material.opacity = 0.4 + Math.sin(Date.now() * 0.008) * 0.2;
                    requestAnimationFrame(animateAura);
                }
            };
            animateAura();

            // Boss particles (floating energy orbs)
            boss.particles = [];
            for (let i = 0; i < 12; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.3, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.7,
                        emissive: 0xff0000,
                        emissiveIntensity: 1.0
                    })
                );
                const angle = (i / 12) * Math.PI * 2;
                const radius = 4;
                particle.position.set(
                    Math.cos(angle) * radius,
                    2 + Math.sin(Date.now() * 0.001 + i) * 0.5,
                    Math.sin(angle) * radius
                );
                boss.model.add(particle);
                boss.particles.push({ mesh: particle, angle: angle, baseY: 2 });
            }

            // Animate particles
            const animateParticles = () => {
                if (boss.particles && boss.model) {
                    boss.particles.forEach((p, i) => {
                        if (p.mesh && p.mesh.parent) {
                            const time = Date.now() * 0.001;
                            p.mesh.position.x = Math.cos(p.angle + time * 0.5) * 4;
                            p.mesh.position.z = Math.sin(p.angle + time * 0.5) * 4;
                            p.mesh.position.y = p.baseY + Math.sin(time * 2 + i) * 0.5;
                            p.mesh.rotation.y += 0.1;
                        }
                    });
                    requestAnimationFrame(animateParticles);
                }
            };
            animateParticles();

            // Screen effect on spawn
            if (window.screenShake) window.screenShake(1.0);

            // Spawn effect particles
            if (window.Game && window.Game.scene) {
                for (let i = 0; i < 30; i++) {
                    const particle = new THREE.Mesh(
                        new THREE.SphereGeometry(0.2, 6, 6),
                        new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            transparent: true,
                            opacity: 0.8
                        })
                    );
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 10;
                    particle.position.set(
                        Math.cos(angle) * dist,
                        Math.random() * 5,
                        Math.sin(angle) * dist
                    );
                    window.Game.scene.add(particle);

                    // Animate and remove
                    let life = 2.0;
                    const anim = () => {
                        life -= 0.05;
                        if (life > 0 && particle.parent) {
                            particle.position.y += 0.2;
                            particle.material.opacity = life / 2.0 * 0.8;
                            particle.scale.setScalar(1 + (2.0 - life) * 0.5);
                            requestAnimationFrame(anim);
                        } else {
                            if (particle.parent) window.Game.scene.remove(particle);
                        }
                    };
                    anim();
                }
            }

            // Boss health bar
            WorldBossSystem.createBossHealthBar(boss);

            // Phase 25.2: Initialize multi-phase AI
            WorldBossSystem.initializeBossAI(boss);
        }

        return boss;
    },

    // Phase 25.2: Multi-phase boss AI
    initializeBossAI: (boss) => {
        if (!boss) return;

        // Override update function
        const originalUpdate = boss.update || (() => {});
        boss.update = function(dt) {
            originalUpdate.call(this, dt);

            // Check phase transitions
            const hpPercent = (this.health || 0) / (this.originalMaxHealth || 1);

            // Phase 2: 50% HP - Spawn minions
            if (hpPercent <= 0.5 && WorldBossSystem.bossPhase === 1) {
                WorldBossSystem.bossPhase = 2;
                WorldBossSystem.spawnMinions(this);

                // Quick Feature 5: Phase transition visual effects
                if (this.model && window.Game && window.Game.scene) {
                    // Flash effect
                    const flash = new THREE.Mesh(
                        new THREE.SphereGeometry(15, 16, 16),
                        new THREE.MeshBasicMaterial({
                            color: 0xff8800,
                            transparent: true,
                            opacity: 0.5
                        })
                    );
                    flash.position.copy(this.model.position);
                    window.Game.scene.add(flash);

                    let flashLife = 0.5;
                    const flashAnim = () => {
                        flashLife -= 0.05;
                        if (flashLife > 0) {
                            flash.material.opacity = flashLife / 0.5 * 0.5;
                            flash.scale.setScalar(1 + (0.5 - flashLife) * 2);
                            requestAnimationFrame(flashAnim);
                        } else {
                            window.Game.scene.remove(flash);
                        }
                    };
                    flashAnim();
                }

                if (window.createFloater) {
                    window.createFloater("BOSS PHASE 2: MINIONS!", this.model.position, "#ff8800");
                }
                if (window.screenShake) window.screenShake(0.8);
            }

            // Phase 3: 20% HP - Enrage mode
            if (hpPercent <= 0.2 && WorldBossSystem.bossPhase === 2) {
                WorldBossSystem.bossPhase = 3;
                WorldBossSystem.enrageBoss(this);

                // Quick Feature 5: Enrage visual effects
                if (this.model && window.Game && window.Game.scene) {
                    // Intense red flash
                    const enrageFlash = new THREE.Mesh(
                        new THREE.SphereGeometry(20, 16, 16),
                        new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            transparent: true,
                            opacity: 0.7
                        })
                    );
                    enrageFlash.position.copy(this.model.position);
                    window.Game.scene.add(enrageFlash);

                    let flashLife = 1.0;
                    const flashAnim = () => {
                        flashLife -= 0.05;
                        if (flashLife > 0) {
                            enrageFlash.material.opacity = flashLife / 1.0 * 0.7;
                            enrageFlash.scale.setScalar(1 + (1.0 - flashLife) * 1.5);
                            requestAnimationFrame(flashAnim);
                        } else {
                            window.Game.scene.remove(enrageFlash);
                        }
                    };
                    flashAnim();

                    // Increase particle count
                    if (this.particles) {
                        for (let i = 0; i < 8; i++) {
                            const particle = new THREE.Mesh(
                                new THREE.SphereGeometry(0.4, 8, 8),
                                new THREE.MeshBasicMaterial({
                                    color: 0xff0000,
                                    transparent: true,
                                    opacity: 0.9,
                                    emissive: 0xff0000,
                                    emissiveIntensity: 1.5
                                })
                            );
                            const angle = (i / 8) * Math.PI * 2;
                            particle.position.set(
                                Math.cos(angle) * 5,
                                3,
                                Math.sin(angle) * 5
                            );
                            this.model.add(particle);
                            this.particles.push({ mesh: particle, angle: angle, baseY: 3 });
                        }
                    }
                }

                if (window.createFloater) {
                    window.createFloater("BOSS ENRAGED! DOUBLE SPEED!", this.model.position, "#ff0000");
                }
                if (window.screenShake) window.screenShake(1.5);
            }
        };
    },

    // Spawn minions (Phase 2)
    spawnMinions: (boss) => {
        if (!window.Game || !window.Game.scene || !boss || !boss.model) return;

        const minionCount = 5;
        for (let i = 0; i < minionCount; i++) {
            const angle = (i / minionCount) * Math.PI * 2;
            const radius = 10;
            const x = boss.model.position.x + Math.cos(angle) * radius;
            const z = boss.model.position.z + Math.sin(angle) * radius;

            if (window.spawnAnimeMinion) {
                const minion = window.spawnAnimeMinion(new THREE.Vector3(x, 0, z));
                if (minion) {
                    minion.isBossMinion = true;
                    minion.bossOwner = boss;
                }
            }
        }
    },

    // Enrage boss (Phase 3)
    enrageBoss: (boss) => {
        if (!boss) return;

        // Double speed and damage
        if (boss.speed !== undefined) boss.speed *= 2;
        boss.attackPower = (boss.attackPower || 1) * 2;

        // Quick Feature 5: Enhanced enrage visual effects
        // Intense red glow with faster pulse
        if (boss.model && boss.model.material) {
            boss.model.material.emissive = new THREE.Color(0xff0000);
            boss.model.material.emissiveIntensity = 1.5;

            // Faster pulsing
            const pulseEnrage = () => {
                if (boss.model && boss.model.material && boss.model.material.emissive) {
                    const intensity = 1.2 + Math.sin(Date.now() * 0.01) * 0.5;
                    boss.model.material.emissiveIntensity = intensity;
                    requestAnimationFrame(pulseEnrage);
                }
            };
            pulseEnrage();
        }

        // Enhance aura ring
        if (boss.auraRing && boss.auraRing.material) {
            boss.auraRing.material.color.setHex(0xff0000);
            boss.auraRing.material.emissive = new THREE.Color(0xff0000);
            boss.auraRing.material.emissiveIntensity = 1.0;
            boss.auraRing.scale.setScalar(1.5);
        }

        // Screen shake
        if (window.screenShake) window.screenShake(1.0);
    },

    // Create boss health bar UI
    createBossHealthBar: (boss) => {
        let bar = document.getElementById('world-boss-health-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'world-boss-health-bar';
            bar.innerHTML = `
                <div class="boss-name" id="boss-name">TITAN BOSS</div>
                <div class="boss-health-container">
                    <div class="boss-health-bar" id="boss-health-fill"></div>
                    <div class="boss-health-text" id="boss-health-text">100%</div>
                </div>
            `;
            bar.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                width: 600px;
                background: rgba(0, 0, 0, 0.9);
                border: 3px solid #ff0000;
                border-radius: 8px;
                padding: 12px;
                z-index: 300;
                display: none;
            `;

            const style = document.createElement('style');
            style.textContent = `
                .boss-name { font-size: 20px; font-weight: bold; color: #ff0000; text-align: center; margin-bottom: 8px; }
                .boss-health-container { position: relative; height: 30px; background: rgba(255, 0, 0, 0.2); border-radius: 4px; overflow: hidden; }
                .boss-health-bar { height: 100%; background: linear-gradient(90deg, #ff0000, #ff8800); transition: width 0.3s; }
                .boss-health-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            `;
            document.head.appendChild(style);
            document.body.appendChild(bar);
        }

        bar.style.display = 'block';

        // Update health bar
        const updateHealthBar = () => {
            if (!boss || boss.isDead) {
                bar.style.display = 'none';
                return;
            }

            const hpPercent = Math.max(0, Math.min(100, (boss.health || 0) / (boss.maxHealth || 1) * 100));
            const fill = document.getElementById('boss-health-fill');
            const text = document.getElementById('boss-health-text');

            if (fill) fill.style.width = hpPercent + '%';
            if (text) text.textContent = `${Math.round(hpPercent)}%`;

            requestAnimationFrame(updateHealthBar);
        };
        updateHealthBar();
    },

    // Phase 25.3: Raid loot tables
    getBossLoot: (bossId) => {
        const lootTables = {
            'titan_01': [
                { id: 'legendary_sword', chance: 0.1, quantity: 1 },
                { id: 'legendary_armor', chance: 0.15, quantity: 1 },
                { id: 'soul_shard', chance: 0.5, quantity: 50 },
                { id: 'gold', chance: 1.0, quantity: 10000 }
            ]
        };

        return lootTables[bossId] || [];
    },

    // Drop loot when boss dies
    onBossDeath: (boss) => {
        if (!boss || !boss.isWorldBoss) return;

        const lootTable = WorldBossSystem.getBossLoot(boss.bossId);

        lootTable.forEach(loot => {
            if (Math.random() < loot.chance) {
                // Drop loot
                if (loot.id === 'gold') {
                    if (window.gameState) {
                        window.gameState.gold = (window.gameState.gold || 0) + loot.quantity;
                    }
                } else {
                    // Add item to inventory
                    if (window.BagSystem && typeof window.BagSystem.addItem === 'function') {
                        const itemData = window.A1K_ITEMS_DB && window.A1K_ITEMS_DB[loot.id];
                        if (itemData) {
                            window.BagSystem.addItem(loot.id, loot.quantity, itemData);
                        }
                    }
                }
            }
        });

        // Clear boss
        WorldBossSystem.currentBoss = null;

        // Hide health bar
        const bar = document.getElementById('world-boss-health-bar');
        if (bar) bar.style.display = 'none';

        console.log('[WorldBossSystem] Boss defeated, loot distributed');
    }
};

window.WorldBossSystem = WorldBossSystem;

// Hook into enemy death
if (window.enemies) {
    // Monitor enemy deaths
    const checkBossDeath = () => {
        if (window.enemies && WorldBossSystem.currentBoss) {
            const boss = WorldBossSystem.currentBoss;
            if (boss && (boss.isDead || (boss.health !== undefined && boss.health <= 0)) && boss.isWorldBoss) {
                WorldBossSystem.onBossDeath(boss);
            }
        }
    };

    setInterval(checkBossDeath, 1000);
}

// Auto-spawn boss on timer (disabled for testing - use manual spawn)
// setInterval(() => {
//     WorldBossSystem.spawnTitan();
// }, WorldBossSystem.bossSpawnInterval);

// Helper function for manual boss spawn (testing)
window.spawnWorldBoss = function() {
    WorldBossSystem.lastBossSpawn = 0; // Reset cooldown
    WorldBossSystem.spawnTitan();
};
