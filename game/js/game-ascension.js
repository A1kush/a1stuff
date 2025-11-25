// Phase 24: Ascension (Prestige) System
const AscensionSystem = {
    soulShards: 0,
    ascensionLevel: 0,

    init: () => {
        // Load ascension data
        if (window.gameState) {
            AscensionSystem.soulShards = window.gameState.soulShards || 0;
            AscensionSystem.ascensionLevel = window.gameState.ascensionLevel || 0;
        }

        console.log('[AscensionSystem] Initialized');
    },

    // Phase 24.1: Rebirth logic
    rebirth: () => {
        if (!window.gameState) return { success: false, message: 'Game state not available' };

        const playerLevel = window.gameState.playerLevel || window.gameState.level || 1;
        const gold = window.gameState.gold || 0;

        // Calculate soul shards reward
        const shardsFromLevel = Math.floor(playerLevel * 10);
        const shardsFromGold = Math.floor(gold / 1000);
        const totalShards = shardsFromLevel + shardsFromGold;

        if (totalShards < 100) {
            return { success: false, message: 'Need at least 100 Soul Shards to rebirth' };
        }

        // Confirm rebirth
        if (!confirm(`Rebirth? You will lose all progress but gain ${totalShards} Soul Shards.\n\nThis will reset:\n- Level to 1\n- Gold to 0\n- Skills locked\n\nContinue?`)) {
            return { success: false, message: 'Rebirth cancelled' };
        }

        // Hard reset
        window.gameState.playerLevel = 1;
        window.gameState.level = 1;
        window.gameState.xp = 0;
        window.gameState.xpToNext = 100;
        window.gameState.gold = 0;

        // Lock skills (reset skill unlocks)
        if (window.gameState.unlockedSkills) {
            window.gameState.unlockedSkills = [];
        }

        // Grant soul shards
        AscensionSystem.soulShards += totalShards;
        AscensionSystem.ascensionLevel++;

        // Save
        if (window.gameState) {
            window.gameState.soulShards = AscensionSystem.soulShards;
            window.gameState.ascensionLevel = AscensionSystem.ascensionLevel;
        }

        // Visual feedback
        if (window.createFloater && window.party && window.party[0]) {
            window.createFloater(
                `REBIRTH! +${totalShards} Soul Shards`,
                window.party[0].model.position,
                "#ff00ff"
            );
        }

        console.log(`[AscensionSystem] Rebirth complete. Shards: ${AscensionSystem.soulShards}, Level: ${AscensionSystem.ascensionLevel}`);

        return { success: true, shardsGained: totalShards, newShards: AscensionSystem.soulShards };
    },

    // Phase 24.2: Ascension Tree - Permanent buffs
    ascensionTree: {
        buffs: [
            {
                id: 'xp_gain_50',
                name: 'XP Mastery',
                description: '+50% XP Gain',
                cost: 10,
                effect: () => {
                    // Applied in XP calculation
                }
            },
            {
                id: 'start_epic_weapon',
                name: 'Epic Start',
                description: 'Start with Epic Weapon',
                cost: 25,
                effect: () => {
                    // Grant epic weapon on new game
                }
            },
            {
                id: 'gold_gain_30',
                name: 'Gold Magnet',
                description: '+30% Gold Gain',
                cost: 15,
                effect: () => {
                    // Applied in gold calculation
                }
            },
            {
                id: 'stat_boost_20',
                name: 'Natural Power',
                description: '+20% All Stats',
                cost: 30,
                effect: () => {
                    // Applied in stat calculation
                }
            },
            {
                id: 'skill_unlock_all',
                name: 'Skill Master',
                description: 'All Skills Unlocked',
                cost: 50,
                effect: () => {
                    // Unlock all skills
                }
            }
        ],

        purchasedBuffs: [],

        // Purchase buff
        purchaseBuff: (buffId) => {
            const buff = AscensionSystem.ascensionTree.buffs.find(b => b.id === buffId);
            if (!buff) return { success: false, message: 'Buff not found' };

            if (AscensionSystem.ascensionTree.purchasedBuffs.includes(buffId)) {
                return { success: false, message: 'Buff already purchased' };
            }

            if (AscensionSystem.soulShards < buff.cost) {
                return { success: false, message: `Need ${buff.cost} Soul Shards` };
            }

            AscensionSystem.soulShards -= buff.cost;
            AscensionSystem.ascensionTree.purchasedBuffs.push(buffId);

            // Save
            if (window.gameState) {
                window.gameState.soulShards = AscensionSystem.soulShards;
                window.gameState.ascensionBuffs = AscensionSystem.ascensionTree.purchasedBuffs;
            }

            return { success: true, buff: buff };
        },

        // Check if buff is purchased
        hasBuff: (buffId) => {
            return AscensionSystem.ascensionTree.purchasedBuffs.includes(buffId);
        }
    }
};

window.AscensionSystem = AscensionSystem;

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AscensionSystem.init();
    });
} else {
    AscensionSystem.init();
}
