// js/game-integration.js
// THE BRIDGE: Connects BagSystem Data (UI) to GameEngine (3D World)

(function() {
    'use strict';

    // Main Sync Loop - Runs every 500ms to keep stats fresh
    // Less frequent than frame loop to save performance
    window.startStatSync = function() {
        if (window.statSyncInterval) clearInterval(window.statSyncInterval);

        window.statSyncInterval = setInterval(() => {
            syncPlayerStats();
            syncEquippedSkills();
        }, 500);

        console.log("[Bridge] Stat & Skill Sync Started");
    };

    // 1. SYNC STATS (Bag -> Combat)
    function syncPlayerStats() {
        // Guard clauses
        if (!window.BagSystem || !window.gameState || !window.party || !window.party[0]) return;
        if (!window.combatEngine) return;

        // 1. Get calculated stats from Bag System (includes gear, talents, etc.)
        const bagStats = window.BagSystem.computePlayerStats();
        if (!bagStats) return;

        // 2. Apply to 3D Player Model (CharacterController)
        const player = window.party[0];

        // Health Sync (Preserve percentage when max HP changes)
        const hpPercent = player.health / (player.maxHealth || 1000);
        player.maxHealth = bagStats.hp || 1000;
        player.health = Math.ceil(player.maxHealth * hpPercent);

        // Movement Speed
        // Base speed 8 + Bag Speed bonus
        player.speed = 8 + (bagStats.speed || 0);

        // 3. Apply to Combat Engine (Damage Calculation)
        // We update the 'characters' config inside CombatEngine3D
        const charId = player.characterId || 'A1';
        if (window.combatEngine && window.combatEngine.characters && window.combatEngine.characters[charId]) {
            const charConfig = window.combatEngine.characters[charId];

            // Convert "Attack" to a multiplier or raw damage
            // Assuming base damage is ~100, we scale it
            charConfig.attackPower = 1.0 + ((bagStats.attack || 0) / 100);
            charConfig.critRate = bagStats.critRate || 0.05;
            charConfig.critDamage = bagStats.critDamage || 1.5;
            charConfig.defense = bagStats.defense || 0;
            charConfig.maxHP = bagStats.hp || 1000;

            // Update current HP if max changed
            if (window.combatEngine.currentHP && window.combatEngine.maxHP) {
                const hpPercent = window.combatEngine.currentHP / window.combatEngine.maxHP;
                window.combatEngine.maxHP = bagStats.hp || 1000;
                window.combatEngine.currentHP = Math.ceil(window.combatEngine.maxHP * hpPercent);
            }
        }

        // Optional: Sync Currency to UI HUD if not already handled
        const uiGold = document.getElementById('gold-display'); // If you add this to HUD
        if (uiGold) uiGold.textContent = window.gameState.gold.toLocaleString();
    }

    // 2. SYNC SKILLS (Bag -> Hotbar)
    function syncEquippedSkills() {
        if (!window.gameState || !window.gameState.equippedSkills) return;

        const activeChar = window.gameState.currentCharacter || 'A1';
        const loadout = window.gameState.equippedSkills[activeChar];

        if (!loadout) return;

        // We need to ensure the Combat Engine uses these IDs
        // CombatEngine3D usually looks up skills dynamically,
        // but we can cache them for performance or UI updates.

        // Update UI Hotbar Icons (if you have them in the HUD)
        updateSkillIcon('s1', loadout.S1);
        updateSkillIcon('s2', loadout.S2);
        updateSkillIcon('s3', loadout.S3);

        // Sync legacy format for backward compatibility
        if (loadout.S1 || loadout.S2 || loadout.S3) {
            const skillIds = [
                loadout.S1?.id || null,
                loadout.S2?.id || null,
                loadout.S3?.id || null
            ].filter(id => id !== null);

            if (skillIds.length > 0) {
                window.equippedSkills[activeChar] = skillIds;
            }
        }
    }

    // Helper to update HUD icons
    function updateSkillIcon(slotId, skill) {
        const btn = document.querySelector(`[data-btn="${slotId}"]`);
        if (btn && skill) {
            // Update icon/text if supported
            // btn.innerHTML = skill.icon; // Example
            btn.setAttribute('title', skill.name || skill.id || 'No Skill');

            // Visual: Add rarity border
            const rarityColors = {
                common: '#fff',
                uncommon: '#4caf50',
                rare: '#4fc3f7',
                epic: '#a78bfa',
                legendary: '#ffd700',
                starter: '#9e9e9e'
            };
            const tier = skill.tier || 'common';
            btn.style.borderColor = rarityColors[tier] || rarityColors.common;
        }
    }

    // 3. HANDLE DROPS (World -> Bag)
    // Call this when 3D collision happens with a loot drop
    window.collectWorldItem = function(itemData) {
        if (!itemData) return;

        // 1. Add to Bag
        if (typeof window.addItemToBag === 'function') {
            window.addItemToBag(itemData);
        }

        // 2. Visual Feedback (Toast)
        if (window.BagSystem && typeof window.BagSystem.showToast === 'function') {
            window.BagSystem.showToast(`Picked up: ${itemData.icon || '📦'} ${itemData.name || itemData.id}`);
        }

        // 3. Sound
        if (window.BagSystem && typeof window.BagSystem.playCandySfx === 'function') {
            window.BagSystem.playCandySfx('ui-click');
        }
    };

    // Start the engine
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.BagSystem && window.party && window.party[0]) {
                window.startStatSync();
            } else {
                // Retry after systems load
                setTimeout(() => {
                    if (window.BagSystem && window.party && window.party[0]) {
                        window.startStatSync();
                    }
                }, 2000);
            }
        }, 2000); // Wait for other systems to load
    });

    // Also start when game initializes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.startStatSync, 3000);
        });
    } else {
        setTimeout(window.startStatSync, 3000);
    }

    // Phase 20.1: Pet XP & Leveling System
    const PetXPSystem = {
        // Initialize pet XP properties when pet is equipped
        initializePetXP: (pet) => {
            if (!pet) return;

            // Initialize XP properties if they don't exist
            if (typeof pet.currentXP !== 'number') pet.currentXP = 0;
            if (typeof pet.level !== 'number') pet.level = 1;
            if (typeof pet.maxXP !== 'number') {
                pet.maxXP = PetXPSystem.calculateXPForLevel(pet.level);
            }
        },

        // Calculate XP required for a pet level
        calculateXPForLevel: (level) => {
            // Exponential curve: 100 * level^1.5
            return Math.floor(100 * Math.pow(level, 1.5));
        },

        // Distribute 10% of player XP to equipped pet
        distributeXPToPet: (playerXPAmount) => {
            if (!window.gameState || !window.gameState.equipped || !window.gameState.equipped.pet) {
                return;
            }

            const pet = window.gameState.equipped.pet;
            PetXPSystem.initializePetXP(pet);

            // 10% of player XP goes to pet
            const petXPAmount = Math.floor(playerXPAmount * 0.1);
            if (petXPAmount <= 0) return;

            pet.currentXP += petXPAmount;

            // Check for level ups
            let levelsGained = 0;
            while (pet.currentXP >= pet.maxXP) {
                pet.currentXP -= pet.maxXP;
                pet.level++;
                pet.maxXP = PetXPSystem.calculateXPForLevel(pet.level);
                levelsGained++;

                // Visual feedback
                if (window.createFloater && window.party && window.party[0]) {
                    window.createFloater(
                        `${pet.name || 'Pet'} Level Up! Lv.${pet.level}`,
                        window.party[0].model.position,
                        "#00ff00"
                    );
                }
            }

            // Update pet stats on level up (10% stat increase per level)
            if (levelsGained > 0) {
                PetXPSystem.updatePetStatsOnLevelUp(pet, levelsGained);
            }

            console.log(`[PetXP] Pet gained ${petXPAmount} XP (${pet.currentXP}/${pet.maxXP}), Level: ${pet.level}`);
        },

        // Update pet stats when leveling up
        updatePetStatsOnLevelUp: (pet, levelsGained) => {
            // Increase stats by 10% per level (multiplicative)
            const statMultiplier = Math.pow(1.1, levelsGained);

            if (pet.attack) pet.attack = Math.floor(pet.attack * statMultiplier);
            if (pet.defense) pet.defense = Math.floor(pet.defense * statMultiplier);
            if (pet.health || pet.hp) {
                const baseHP = pet.health || pet.hp;
                pet.health = Math.floor(baseHP * statMultiplier);
                pet.hp = pet.health;
            }
            if (pet.speed) pet.speed = pet.speed * statMultiplier;

            console.log(`[PetXP] Pet stats increased by ${((statMultiplier - 1) * 100).toFixed(1)}%`);
        }
    };

    window.PetXPSystem = PetXPSystem;

    // Phase 20.2: Pet Evolution System
    const PetEvolutionSystem = {
        // Evolution chains: basePetId -> evolvedPetId
        evolutionChains: {
            'pet_firecub': 'pet_inferno_wolf',
            'pet_drone': 'pet_plasma_drone',
            'pet_cube': 'pet_firecub' // Cube can evolve to Fire Cub
        },

        // Check if pet can evolve
        canEvolve: (pet) => {
            if (!pet) return false;

            // Check level requirement
            if (!pet.level || pet.level < 10) return false;

            // Check if evolution exists
            if (!PetEvolutionSystem.evolutionChains[pet.id]) return false;

            // Check if player has evolution stone
            if (!window.gameState || !window.gameState.inventory) return false;

            const hasStone = window.gameState.inventory.some(item =>
                item && (item.id === 'evolution_stone' || item.name === 'Evolution Stone')
            );

            return hasStone;
        },

        // Evolve pet
        evolvePet: (pet) => {
            if (!PetEvolutionSystem.canEvolve(pet)) {
                return { success: false, message: "Cannot evolve: Level < 10 or missing Evolution Stone" };
            }

            const evolvedId = PetEvolutionSystem.evolutionChains[pet.id];
            if (!evolvedId) {
                return { success: false, message: "No evolution available for this pet" };
            }

            // Get evolved pet data
            const evolvedPetData = window.A1K_ITEMS_DB && window.A1K_ITEMS_DB[evolvedId];
            if (!evolvedPetData) {
                return { success: false, message: "Evolved pet data not found" };
            }

            // Remove evolution stone from inventory
            if (window.BagSystem && typeof window.BagSystem.removeItem === 'function') {
                const stoneIndex = window.gameState.inventory.findIndex(item =>
                    item && (item.id === 'evolution_stone' || item.name === 'Evolution Stone')
                );
                if (stoneIndex >= 0) {
                    window.BagSystem.removeItem(stoneIndex, 1);
                }
            }

            // Create evolved pet with preserved stats
            const evolvedPet = {
                ...evolvedPetData,
                id: evolvedId,
                level: pet.level,
                currentXP: pet.currentXP,
                maxXP: pet.maxXP,
                // Preserve and enhance stats
                attack: evolvedPetData.attack || (pet.attack ? pet.attack * 1.5 : 50),
                health: evolvedPetData.health || (pet.health ? pet.health * 1.5 : 150),
                hp: evolvedPetData.health || (pet.hp ? pet.hp * 1.5 : 150),
                speed: evolvedPetData.speed || (pet.speed ? pet.speed * 1.2 : 10),
                defense: pet.defense ? pet.defense * 1.3 : (evolvedPetData.defense || 20)
            };

            // Replace pet in equipped slot
            if (window.gameState && window.gameState.equipped) {
                window.gameState.equipped.pet = evolvedPet;
            }

            // Replace in inventory if exists
            if (window.gameState && window.gameState.inventory) {
                const petIndex = window.gameState.inventory.findIndex(item =>
                    item && item.id === pet.id && item.uid === pet.uid
                );
                if (petIndex >= 0) {
                    window.gameState.inventory[petIndex] = evolvedPet;
                }
            }

            // Visual feedback
            if (window.createFloater && window.party && window.party[0]) {
                window.createFloater(
                    `${pet.name} → ${evolvedPet.name}!`,
                    window.party[0].model.position,
                    "#ff00ff"
                );
            }

            // Screen effect
            if (window.screenShake) window.screenShake(0.5);

            console.log(`[PetEvolution] ${pet.name} evolved to ${evolvedPet.name}`);

            return { success: true, evolvedPet: evolvedPet };
        }
    };

    window.PetEvolutionSystem = PetEvolutionSystem;

    // Phase 20.3: Advanced Pet AI Behaviors System
    const PetAISystem = {
        lastTauntTime: 0,
        lastHealTime: 0,
        lastBuffTime: 0,
        tauntCooldown: 5000, // 5 seconds
        healCooldown: 3000,  // 3 seconds
        buffCooldown: 10000, // 10 seconds

        // Determine pet role based on stats
        getPetRole: (pet) => {
            if (!pet) return 'dps';

            // Tank: High HP/Defense relative to attack
            const hpRatio = (pet.health || pet.hp || 0) / Math.max(pet.attack || 1, 1);
            const defRatio = (pet.defense || 0) / Math.max(pet.attack || 1, 1);

            if (hpRatio > 3 || defRatio > 1.5) return 'tank';

            // Healer: Has healing ability or high HP with low attack
            if (pet.ability && (pet.ability.toLowerCase().includes('heal') ||
                pet.ability.toLowerCase().includes('restore'))) {
                return 'healer';
            }

            // Buffer: Has buff ability
            if (pet.ability && (pet.ability.toLowerCase().includes('buff') ||
                pet.ability.toLowerCase().includes('boost') ||
                pet.ability.toLowerCase().includes('aura'))) {
                return 'buffer';
            }

            // Default: DPS
            return 'dps';
        },

        // Update pet AI behavior
        update: (dt) => {
            if (!window.Game || !window.Game.petActive || !window.Game.petMesh || !window.Game.petData) {
                return;
            }

            const pet = window.Game.petData;
            const petMesh = window.Game.petMesh;
            const player = window.party && window.party[0] ? window.party[0] : null;

            if (!player || !player.model) return;

            const role = PetAISystem.getPetRole(pet);
            const now = Date.now();

            // Quick Feature 1: Pet projectile attacks (DPS pets)
            if (role === 'dps' || role === 'tank') {
                PetAISystem.performPetAttack(petMesh, pet);
            }

            // TANK Behavior: Taunt enemies every 5 seconds
            if (role === 'tank') {
                if (now - PetAISystem.lastTauntTime > PetAISystem.tauntCooldown) {
                    PetAISystem.performTaunt(petMesh, player);
                    PetAISystem.lastTauntTime = now;
                }
            }

            // HEALER Behavior: Heal player when HP < 30%
            if (role === 'healer') {
                const hpPercent = (player.health || 0) / (player.maxHealth || 1000);
                if (hpPercent < 0.3 && now - PetAISystem.lastHealTime > PetAISystem.healCooldown) {
                    PetAISystem.performHeal(petMesh, player);
                    PetAISystem.lastHealTime = now;
                }
            }

            // BUFFER Behavior: Grant +10% Damage Aura
            if (role === 'buffer') {
                if (now - PetAISystem.lastBuffTime > PetAISystem.buffCooldown) {
                    PetAISystem.performBuff(petMesh, player);
                    PetAISystem.lastBuffTime = now;
                }
            }

            // Basic pet follow behavior (all roles)
            PetAISystem.updateFollowBehavior(petMesh, player, role);
        },

        // Tank: Taunt enemies
        performTaunt: (petMesh, player) => {
            if (!window.enemies || window.enemies.length === 0) return;

            // Find nearest enemy
            let nearestEnemy = null;
            let minDist = 15;

            window.enemies.forEach(enemy => {
                if (!enemy.isDead && enemy.model) {
                    const dist = petMesh.position.distanceTo(enemy.model.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                }
            });

            if (nearestEnemy) {
                // Redirect enemy aggro to pet
                if (nearestEnemy.target !== petMesh) {
                    nearestEnemy.target = petMesh;
                    nearestEnemy.aggroTarget = petMesh;
                }

                // Visual feedback
                if (window.createFloater) {
                    window.createFloater("TAUNT!", petMesh.position, "#ff8800");
                }

                // Sound/visual effect
                if (window.screenShake) window.screenShake(0.1);

                console.log('[PetAI] Tank pet taunted enemy');
            }
        },

        // Healer: Heal player
        performHeal: (petMesh, player) => {
            const healAmount = Math.floor((player.maxHealth || 1000) * 0.15); // 15% heal
            player.health = Math.min(player.maxHealth, (player.health || 0) + healAmount);

            // Visual feedback
            if (window.createFloater) {
                window.createFloater(`+${healAmount} HP`, player.model.position, "#00ff00");
            }

            // Healing effect
            if (window.Game && window.Game.scene) {
                const healParticles = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 16, 16),
                    new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.5
                    })
                );
                healParticles.position.copy(player.model.position);
                healParticles.position.y = 1.5;
                window.Game.scene.add(healParticles);

                // Animate and remove
                let life = 1.0;
                const anim = () => {
                    life -= 0.05;
                    if (life > 0) {
                        healParticles.scale.setScalar(1 + (1.0 - life));
                        healParticles.material.opacity = life * 0.5;
                        healParticles.position.y += 0.1;
                        requestAnimationFrame(anim);
                    } else {
                        window.Game.scene.remove(healParticles);
                    }
                };
                anim();
            }

            console.log('[PetAI] Healer pet healed player for', healAmount);
        },

        // Buffer: Grant damage aura
        performBuff: (petMesh, player) => {
            // Apply 10% damage buff for 10 seconds
            if (!player.damageMultiplier) player.damageMultiplier = 1.0;
            player.damageMultiplier = 1.1;

            // Visual aura effect
            if (window.Game && window.Game.scene) {
                // Remove existing aura if any
                if (window.Game.petBuffAura) {
                    window.Game.scene.remove(window.Game.petBuffAura);
                }

                const aura = new THREE.Mesh(
                    new THREE.RingGeometry(1.5, 2.5, 32),
                    new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.6,
                        side: THREE.DoubleSide
                    })
                );
                aura.rotation.x = -Math.PI / 2;
                aura.position.copy(player.model.position);
                aura.position.y = 0.1;
                window.Game.scene.add(aura);
                window.Game.petBuffAura = aura;

                // Animate aura
                const animateAura = () => {
                    if (aura && aura.parent) {
                        aura.rotation.z += 0.02;
                        requestAnimationFrame(animateAura);
                    }
                };
                animateAura();

                // Remove after 10 seconds
                setTimeout(() => {
                    if (window.Game.petBuffAura && window.Game.petBuffAura.parent) {
                        window.Game.scene.remove(window.Game.petBuffAura);
                        window.Game.petBuffAura = null;
                    }
                    if (player.damageMultiplier) player.damageMultiplier = 1.0;
                }, 10000);
            }

            // Visual feedback
            if (window.createFloater) {
                window.createFloater("+10% DAMAGE!", petMesh.position, "#ffff00");
            }

            console.log('[PetAI] Buffer pet granted damage aura');
        },

        // Update pet follow behavior based on role
        updateFollowBehavior: (petMesh, player, role) => {
            if (!petMesh || !player || !player.model) return;

            const playerPos = player.model.position;
            const petPos = petMesh.position;
            const dist = petPos.distanceTo(playerPos);

            // Different follow distances based on role
            const followDistances = {
                tank: 3.0,    // Close for tanking
                healer: 4.0,  // Medium for healing
                buffer: 5.0,  // Medium for buffing
                dps: 2.5      // Close for attacking
            };

            const targetDistance = followDistances[role] || 3.0;

            // Move pet towards player if too far
            if (dist > targetDistance + 1) {
                const direction = new THREE.Vector3()
                    .subVectors(playerPos, petPos)
                    .normalize();

                const speed = 0.1;
                petMesh.position.add(direction.multiplyScalar(speed));
            }

            // Keep pet at proper height
            petMesh.position.y = Math.max(0.5, Math.min(1.5, petMesh.position.y));
        },

        // Quick Feature 1: Pet projectile attacks
        lastPetAttackTime: 0,
        petAttackCooldown: 2000, // 2 seconds

        performPetAttack: (petMesh, petData) => {
            if (!petMesh || !petData || !window.enemies) return;

            const now = Date.now();
            if (now - PetAISystem.lastPetAttackTime < PetAISystem.petAttackCooldown) return;

            // Find nearest enemy
            let nearestEnemy = null;
            let minDist = 15;

            window.enemies.forEach(enemy => {
                if (!enemy.isDead && enemy.model) {
                    const dist = petMesh.position.distanceTo(enemy.model.position);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                }
            });

            if (!nearestEnemy) return;

            // Create pet projectile
            if (window.combatEngine && window.combatEngine.projectileManager) {
                const petAttack = petData.attack || 20;
                const petElement = petData.element || 'PHYSICAL';

                const projectile = {
                    mesh: new THREE.Mesh(
                        new THREE.SphereGeometry(0.2, 8, 8),
                        new THREE.MeshBasicMaterial({
                            color: petData.color || 0x00ff00,
                            emissive: petData.color || 0x00ff00,
                            emissiveIntensity: 0.8
                        })
                    ),
                    velocity: new THREE.Vector3()
                        .subVectors(nearestEnemy.model.position, petMesh.position)
                        .normalize()
                        .multiplyScalar(15),
                    damage: petAttack,
                    age: 0,
                    lifetime: 2.0,
                    skillData: {
                        damage: petAttack,
                        element: petElement
                    }
                };

                projectile.mesh.position.copy(petMesh.position);
                projectile.mesh.position.y = 1.0;

                window.Game.scene.add(projectile.mesh);
                window.combatEngine.projectileManager.projectiles.push(projectile);

                PetAISystem.lastPetAttackTime = now;

                // Visual feedback
                if (window.createFloater) {
                    window.createFloater("PET ATTACK!", petMesh.position, petData.color ? `#${petData.color.toString(16)}` : "#00ff00");
                }
            }
        }
    };

    window.PetAISystem = PetAISystem;

    // Hook pet AI into game loop
    if (window.Game && window.Game.update) {
        const originalUpdate = window.Game.update;
        window.Game.update = function(dt) {
            originalUpdate.call(this, dt);
            PetAISystem.update(dt);
        };
    } else {
        // Fallback: Update pet AI every frame
        setInterval(() => {
            if (window.Game && window.Game.petActive) {
                PetAISystem.update(0.016); // ~60fps
            }
        }, 16);
    }

    // Hook into XP gain - wrap the BagSystem's gainXP function
    if (window.BagSystem && typeof window.BagSystem.gainXP === 'function') {
        const originalGainXP = window.BagSystem.gainXP.bind(window.BagSystem);
        window.BagSystem.gainXP = function(amount, options) {
            const result = originalGainXP(amount, options);

            // Distribute 10% to pet
            PetXPSystem.distributeXPToPet(amount);

            return result;
        };
    }

    // Also hook into direct XP additions (for consumables, etc.)
    const originalXPSetter = Object.getOwnPropertyDescriptor(window.gameState || {}, 'xp')?.set;
    if (window.gameState && !originalXPSetter) {
        let lastXPValue = window.gameState.xp || 0;

        // Monitor XP changes
        setInterval(() => {
            if (window.gameState && window.gameState.xp !== undefined) {
                const currentXP = window.gameState.xp || 0;
                const xpGained = currentXP - lastXPValue;
                if (xpGained > 0) {
                    PetXPSystem.distributeXPToPet(xpGained);
                }
                lastXPValue = currentXP;
            }
        }, 1000); // Check every second
    }

    // Initialize pet XP when pet is equipped
    if (window.gameState && window.gameState.equipped && window.gameState.equipped.pet) {
        PetXPSystem.initializePetXP(window.gameState.equipped.pet);
    }

    // Extend A1K_Engine with toggle functions for Pet and Vehicle
    if (window.A1K_Engine) {
        Object.assign(window.A1K_Engine, {
            togglePet: function() {
                const player = window.party && window.party[0] ? window.party[0] : null;
                if (!player) return;

                if (!window.gameState || !window.gameState.equipped || !window.gameState.equipped.pet) {
                    if (window.createFloater) window.createFloater("No Pet Equipped", player.model.position, "#ff0000");
                    return;
                }

                if (window.Game && window.Game.petActive) {
                    // Dismiss
                    window.Game.petActive = false;
                    if (window.Game.petMesh && window.Game.scene) {
                        window.Game.scene.remove(window.Game.petMesh);
                        window.Game.petMesh = null;
                    }
                    if (window.createFloater) window.createFloater("Pet Dismissed", player.model.position, "#ccc");
                } else {
                    // Summon - Re-use equip logic to spawn
                    const petItem = window.gameState.equipped.pet;
                    if (window.A1K_Engine.onEquip) {
                        window.A1K_Engine.onEquip(petItem);
                    }
                    if (window.createFloater) window.createFloater("Pet Summoned!", player.model.position, "#00ff00");
                }
            },

            toggleVehicle: function() {
                const player = window.party && window.party[0] ? window.party[0] : null;
                if (!player) return;

                if (!window.gameState || !window.gameState.equipped || !window.gameState.equipped.vehicle) {
                    if (window.createFloater) window.createFloater("No Vehicle Equipped", player.model.position, "#ff0000");
                    return;
                }

                if (!window.Game) window.Game = {};
                window.Game.vehicleActive = !window.Game.vehicleActive;

                // Toggle visibility of vehicle mesh attached to player
                if (window.party) {
                    window.party.forEach(p => {
                        if (p.model) {
                            const board = p.model.getObjectByName("hoverboard");
                            if (board) board.visible = window.Game.vehicleActive;
                            // Adjust height/speed
                            p.model.position.y = window.Game.vehicleActive ? 2.0 : 0.75;
                            p.speed = window.Game.vehicleActive ? 25 : 8;
                        }
                    });
                }

                const status = window.Game.vehicleActive ? "MOUNTED" : "DISMOUNTED";
                if (window.createFloater) window.createFloater(status, player.model.position, "#FFD700");
            }
        });
    }

    // Universal Interaction System - Expanded
    if (!window.UniversalInteractionSystem) {
        window.UniversalInteractionSystem = {};
    }

    // Extend performAction to handle shops, doors, NPCs
    const originalPerformAction = window.UniversalInteractionSystem.performAction;
    window.UniversalInteractionSystem.performAction = function() {
        const leader = window.party && window.party[0] ? window.party[0] : null;
        if (!leader || !leader.model) return false;

        // Find nearest interactable
        let nearest = null;
        let minDist = 5.0;

        if (window.Game && window.Game.interactables) {
            window.Game.interactables.forEach(obj => {
                if (obj.position) {
                    const d = leader.model.position.distanceTo(obj.position);
                    if (d < minDist) {
                        minDist = d;
                        nearest = obj;
                    }
                }
            });
        }

        if (nearest && nearest.userData) {
            const data = nearest.userData;
            if (data.type === 'mission_board') {
                if (window.MissionBoardOverlay && typeof window.MissionBoardOverlay.open === 'function') {
                    window.MissionBoardOverlay.open();
                } else if (window.MissionBoardSystem && typeof window.MissionBoardSystem.openUI === 'function') {
                    window.MissionBoardSystem.openUI('missions');
                }
                return true;
            }
            else if (data.type === 'quest_board') {
                if (window.QuestBoardUI && typeof window.QuestBoardUI.open === 'function') {
                    window.QuestBoardUI.open();
                } else if (window.MissionBoardSystem && typeof window.MissionBoardSystem.openUI === 'function') {
                    window.MissionBoardSystem.openUI('quests');
                }
                return true;
            }
            else if (data.type === 'shop') {
                if (window.ShopSystem && typeof window.ShopSystem.openUI === 'function') {
                    window.ShopSystem.openUI(data.shopType || 'general');
                }
                return true;
            }
            else if (data.type === 'door') {
                // Open Door Logic (Phase 19 prep)
                if (window.createFloater) window.createFloater("Opening...", nearest.position, "#fff");
                // Simple animation
                if (nearest.rotation) nearest.rotation.y += 1.5;
                return true;
            }
            else if (data.type === 'npc') {
                // Talk Logic (Phase 21 prep)
                if (window.DialogueSystem && typeof window.DialogueSystem.startDialogue === 'function') {
                    window.DialogueSystem.startDialogue(data.id);
                } else if (window.createFloater) {
                    window.createFloater("Hello there!", nearest.position, "#fff");
                }
                return true;
            }
            // Phase 19.3: Portal interaction
            else if (data.id === 'portal' || data.interactable || data.isExitPortal) {
                if (data.onInteract && typeof data.onInteract === 'function') {
                    data.onInteract();
                    return true;
                }
            }
            // Phase 21.1: NPC interaction
            else if (data.type === 'npc') {
                if (data.onInteract && typeof data.onInteract === 'function') {
                    data.onInteract();
                    return true;
                } else if (window.DialogueSystem && typeof window.DialogueSystem.startDialogue === 'function') {
                    window.DialogueSystem.startDialogue(data.npcId);
                    return true;
                }
            }
            // Building System: Building entry
            else if (data.type === 'building' || data.isBuilding === true) {
                if (window.BuildingSystem && data.buildingId) {
                    // Check if we're inside a building (exit) or outside (enter)
                    if (window.BuildingSystem.currentBuilding) {
                        window.BuildingSystem.exitBuilding();
                    } else {
                        window.BuildingSystem.enterBuilding(data.buildingId);
                    }
                    return true;
                }
            }
        }

        // Also check EnvSystem objects for portals
        if (window.EnvSystem && window.EnvSystem.objects) {
            let nearestPortal = null;
            let minDist = 5.0;
            window.EnvSystem.objects.forEach(obj => {
                if (obj.userData && obj.userData.interactable && obj.userData.id === 'portal') {
                    const d = leader.model.position.distanceTo(obj.position);
                    if (d < minDist) {
                        minDist = d;
                        nearestPortal = obj;
                    }
                }
            });

            if (nearestPortal && nearestPortal.userData.onInteract) {
                nearestPortal.userData.onInteract();
                return true;
            }
        }

        // Fallback to original if it exists
        if (originalPerformAction && typeof originalPerformAction === 'function') {
            return originalPerformAction.call(this);
        }

        return false; // No action performed
    };

    // --- PHASE 21: QUEST MANAGER ---
    window.QuestManager = {
        quests: {
            'q1': { id: 'q1', title: 'City Defense', desc: 'Kill 5 Enemies', target: 5, current: 0, status: 'active' }
        },

        onEnemyKilled: () => {
            const q = window.QuestManager.quests['q1'];
            if (q && q.status === 'active') {
                q.current++;
                if (q.current >= q.target) {
                    q.status = 'completed';
                    if (window.createFloater && window.party && window.party[0]) {
                        window.createFloater("QUEST COMPLETE!", window.party[0].model.position, "#00ff00");
                    }
                    // Give Reward
                    if (window.gameState) {
                        window.gameState.gold = (window.gameState.gold || 0) + 1000;
                    }
                }
            }
        }
    };

    // --- PHASE 24: ASCENSION SYSTEM ---
    window.AscensionSystem = {
        canAscend: () => {
            if (!window.gameState) return false;
            return (window.gameState.playerLevel || 1) >= 50;
        },

        ascend: () => {
            if (!window.AscensionSystem.canAscend()) {
                alert('Cannot ascend: Level must be 50 or higher');
                return;
            }

            // 1. Calculate Soul Shards
            const xp = window.gameState.xp || 0;
            const shards = Math.floor(xp / 1000);

            // 2. Reset Stats
            window.gameState.playerLevel = 1;
            window.gameState.xp = 0;
            window.gameState.gold = 0;

            // 3. Grant Shards
            if (!window.gameState.soulShards) window.gameState.soulShards = 0;
            window.gameState.soulShards += shards;

            alert(`ASCENDED! Reset to Level 1. Gained ${shards} Soul Shards.`);

            // Reload to refresh stats
            location.reload();
        }
    };

})();
