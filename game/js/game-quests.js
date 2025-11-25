// Phase 21.3: Quest Manager System
const QuestManager = {
    quests: {},

    // Quest states
    QUEST_STATES: {
        NOT_STARTED: 'not_started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed'
    },

    // Quest database
    questDatabase: {
        'breach_clearance': {
            id: 'breach_clearance',
            name: 'Clear The Breach',
            description: 'Enter and complete The Breach dungeon',
            objective: 'Complete dungeon: breach_01',
            reward: { gold: 5000, xp: 1000 },
            gatedContent: ['breach_01'], // Dungeons that require this quest
            state: 'not_started'
        },
        'first_boss': {
            id: 'first_boss',
            name: 'Defeat the First Boss',
            description: 'Defeat a world boss',
            objective: 'Kill 1 world boss',
            reward: { gold: 10000, xp: 5000 },
            gatedContent: [],
            state: 'not_started'
        }
    },

    // Initialize quests
    init: () => {
        // Load quest states from save
        if (window.gameState && window.gameState.quests) {
            Object.assign(QuestManager.quests, window.gameState.quests);
        } else {
            // Initialize from database
            Object.keys(QuestManager.questDatabase).forEach(questId => {
                QuestManager.quests[questId] = {
                    ...QuestManager.questDatabase[questId],
                    state: QuestManager.QUEST_STATES.NOT_STARTED,
                    progress: 0,
                    maxProgress: 1
                };
            });
        }

        // Save to gameState
        if (!window.gameState) window.gameState = {};
        window.gameState.quests = QuestManager.quests;

        console.log('[QuestManager] Initialized', Object.keys(QuestManager.quests).length, 'quests');
    },

    // Start quest
    startQuest: (questId) => {
        if (!QuestManager.quests[questId]) {
            console.warn(`[QuestManager] Quest ${questId} not found`);
            return false;
        }

        const quest = QuestManager.quests[questId];
        if (quest.state !== QuestManager.QUEST_STATES.NOT_STARTED) {
            console.warn(`[QuestManager] Quest ${questId} already started or completed`);
            return false;
        }

        quest.state = QuestManager.QUEST_STATES.IN_PROGRESS;
        quest.progress = 0;

        // Visual feedback
        if (window.createFloater && window.party && window.party[0]) {
            window.createFloater(
                `Quest Started: ${quest.name}`,
                window.party[0].model.position,
                "#00ff00"
            );
        }

        QuestManager.save();
        console.log(`[QuestManager] Started quest: ${quest.name}`);
        QuestManager.publishEvent('quest:start', { id: quest.id, name: quest.name });
        return true;
    },

    // Update quest progress
    updateQuestProgress: (questId, progress = 1) => {
        if (!QuestManager.quests[questId]) return false;

        const quest = QuestManager.quests[questId];
        if (quest.state !== QuestManager.QUEST_STATES.IN_PROGRESS) return false;

        quest.progress = (quest.progress || 0) + progress;

        // Check completion
        if (quest.progress >= quest.maxProgress) {
            QuestManager.completeQuest(questId);
        }

        QuestManager.save();
        QuestManager.publishEvent('quest:progress', {
            id: quest.id,
            name: quest.name,
            progress: quest.progress,
            maxProgress: quest.maxProgress
        });
        return true;
    },

    // Complete quest
    completeQuest: (questId) => {
        if (!QuestManager.quests[questId]) return false;

        const quest = QuestManager.quests[questId];
        quest.state = QuestManager.QUEST_STATES.COMPLETED;

        // Give rewards
        if (quest.reward) {
            if (quest.reward.gold && window.gameState) {
                window.gameState.gold = (window.gameState.gold || 0) + quest.reward.gold;
            }
            if (quest.reward.xp && window.BagSystem && typeof window.BagSystem.gainXP === 'function') {
                window.BagSystem.gainXP(quest.reward.xp);
            }
        }

        // Visual feedback
        if (window.createFloater && window.party && window.party[0]) {
            window.createFloater(
                `Quest Complete: ${quest.name}!`,
                window.party[0].model.position,
                "#ffd700"
            );
        }

        QuestManager.save();
        console.log(`[QuestManager] Completed quest: ${quest.name}`);
        QuestManager.publishEvent('quest:complete', { id: quest.id, name: quest.name });
        return true;
    },

    // Check if content is gated by quest
    isContentGated: (contentId) => {
        // Check all quests for gated content
        for (const questId in QuestManager.quests) {
            const quest = QuestManager.quests[questId];
            if (quest.gatedContent && quest.gatedContent.includes(contentId)) {
                // Content is gated - check if quest is completed
                return quest.state !== QuestManager.QUEST_STATES.COMPLETED;
            }
        }
        return false; // Not gated
    },

    // Get gating quest for content
    getGatingQuest: (contentId) => {
        for (const questId in QuestManager.quests) {
            const quest = QuestManager.quests[questId];
            if (quest.gatedContent && quest.gatedContent.includes(contentId)) {
                return quest;
            }
        }
        return null;
    },

    // Save quest states
    save: () => {
        if (window.gameState) {
            window.gameState.quests = QuestManager.quests;
        }
    },
    failQuest: (questId, reason = 'unspecified') => {
        if (!QuestManager.quests[questId]) return false;
        const quest = QuestManager.quests[questId];
        quest.state = QuestManager.QUEST_STATES.FAILED;
        QuestManager.save();
        QuestManager.publishEvent('quest:failed', { id: quest.id, name: quest.name, reason });
        return true;
    },

    publishEvent: (topic, payload) => {
        if (window.GameFeatures && window.GameFeatures.missionTelemetry === false) return;
        if (window.A1KBus && typeof window.A1KBus.publish === 'function') {
            window.A1KBus.publish(topic, { ...payload, timestamp: Date.now() });
        }
    }
};

window.QuestManager = QuestManager;

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        QuestManager.init();
    });
} else {
    QuestManager.init();
}

// Hook into dungeon completion
if (window.DungeonManager) {
    const originalExit = window.DungeonManager.exit;
    window.DungeonManager.exit = function() {
        // Check if breach_01 was completed
        if (this.currentDungeon === 'breach_01') {
            QuestManager.updateQuestProgress('breach_clearance', 1);
        }
        return originalExit.call(this);
    };
}
