// Phase 21.2: Dialogue UI System with Typewriter Effect
const DialogueSystem = {
    isActive: false,
    currentDialogue: null,
    currentLineIndex: 0,
    typewriterSpeed: 30, // milliseconds per character

    // Initialize dialogue UI
    init: () => {
        // Create dialogue UI overlay
        const dialogueUI = document.createElement('div');
        dialogueUI.id = 'dialogue-ui';
        dialogueUI.innerHTML = `
            <div class="dialogue-container">
                <div class="dialogue-speaker" id="dialogue-speaker"></div>
                <div class="dialogue-text" id="dialogue-text"></div>
                <div class="dialogue-controls">
                    <button class="dialogue-btn" id="dialogue-next">Next</button>
                    <button class="dialogue-btn" id="dialogue-close">Close</button>
                </div>
            </div>
        `;
        dialogueUI.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border-top: 3px solid #00ff00;
            padding: 20px;
            z-index: 1000;
            display: none;
            font-family: 'Segoe UI', sans-serif;
            color: #fff;
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .dialogue-container {
                max-width: 800px;
                margin: 0 auto;
            }
            .dialogue-speaker {
                font-size: 18px;
                font-weight: bold;
                color: #00ff00;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            .dialogue-text {
                font-size: 16px;
                line-height: 1.6;
                min-height: 60px;
                margin-bottom: 15px;
            }
            .dialogue-controls {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .dialogue-btn {
                padding: 10px 20px;
                background: linear-gradient(135deg, #00ff00, #00cc00);
                border: none;
                border-radius: 6px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
                transition: transform 0.2s;
            }
            .dialogue-btn:hover {
                transform: scale(1.05);
            }
            .dialogue-btn:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(dialogueUI);

        // Event listeners
        document.getElementById('dialogue-next').addEventListener('click', () => {
            DialogueSystem.nextLine();
        });
        document.getElementById('dialogue-close').addEventListener('click', () => {
            DialogueSystem.close();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DialogueSystem.isActive) {
                DialogueSystem.close();
            }
        });
    },

    // Start dialogue with NPC
    startDialogue: (npcId) => {
        const npc = NPCSystem.getNPC(npcId);
        if (!npc || !npc.userData || !npc.userData.npcData) {
            console.warn(`[DialogueSystem] NPC ${npcId} not found`);
            return;
        }

        const npcData = npc.userData.npcData;
        if (!npcData.dialogue || npcData.dialogue.length === 0) {
            console.warn(`[DialogueSystem] NPC ${npcId} has no dialogue`);
            return;
        }

        DialogueSystem.isActive = true;
        DialogueSystem.currentDialogue = npcData.dialogue;
        DialogueSystem.currentLineIndex = 0;

        // Show UI
        const ui = document.getElementById('dialogue-ui');
        const speakerEl = document.getElementById('dialogue-speaker');
        const textEl = document.getElementById('dialogue-text');

        if (ui && speakerEl && textEl) {
            ui.style.display = 'block';
            speakerEl.textContent = `${npcData.icon} ${npcData.name}`;
            DialogueSystem.typeText(npcData.dialogue[0], textEl);
        }

        // Pause game (optional)
        if (window.Game) window.Game.paused = true;
    },

    // Typewriter effect
    typeText: (text, element) => {
        element.textContent = '';
        let index = 0;

        const typeInterval = setInterval(() => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
            } else {
                clearInterval(typeInterval);
            }
        }, DialogueSystem.typewriterSpeed);
    },

    // Next line of dialogue
    nextLine: () => {
        if (!DialogueSystem.currentDialogue) return;

        DialogueSystem.currentLineIndex++;

        if (DialogueSystem.currentLineIndex >= DialogueSystem.currentDialogue.length) {
            DialogueSystem.close();
            return;
        }

        const textEl = document.getElementById('dialogue-text');
        if (textEl) {
            DialogueSystem.typeText(
                DialogueSystem.currentDialogue[DialogueSystem.currentLineIndex],
                textEl
            );
        }
    },

    // Close dialogue
    close: () => {
        DialogueSystem.isActive = false;
        DialogueSystem.currentDialogue = null;
        DialogueSystem.currentLineIndex = 0;

        const ui = document.getElementById('dialogue-ui');
        if (ui) {
            ui.style.display = 'none';
        }

        // Resume game
        if (window.Game) window.Game.paused = false;
    }
};

window.DialogueSystem = DialogueSystem;

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DialogueSystem.init();
    });
} else {
    DialogueSystem.init();
}
