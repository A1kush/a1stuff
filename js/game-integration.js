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
            if (data.type === 'shop') {
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
        }

        // Fallback to original if it exists
        if (originalPerformAction && typeof originalPerformAction === 'function') {
            return originalPerformAction.call(this);
        }

        return false; // No action performed
    };

})();
