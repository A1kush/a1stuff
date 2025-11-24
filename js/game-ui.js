// Game UI System - Input handling, button handlers, and UI updates
// This module handles all user input, button interactions, and UI display updates

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Virtual Joystick Integration (uses candy HUD joystick events)
const vj = { active: false, value: {x:0, y:0} };

// Listen for joystick events from candy HUD
window.addEventListener('joystick:move', (e) => {
    vj.active = true;
    vj.value.x = e.detail.x;
    vj.value.y = e.detail.y;
});

window.addEventListener('joystick:end', (e) => {
    vj.active = false;
    vj.value.x = 0;
    vj.value.y = 0;
});

// Input Handler Function
function handleInput() {
    const player = window.party && window.party[0] ? window.party[0] : null;
    if (!player) return;

    // Check for double-tap dodge (only if not already dodging)
    if (player.dodgeState === 'ready') {
        const now = Date.now();
        const checkDoubleTap = (key, direction) => {
            if (keys[key] && !keys[`${key}_pressed`]) {
                keys[`${key}_pressed`] = true;
                const lastTime = player.lastInputTime[key] || 0;
                if (now - lastTime < player.inputDoubleTapWindow) {
                    // Double tap detected - dodge!
                    player.dodge(direction);
                    return true;
                }
                player.lastInputTime[key] = now;
            } else if (!keys[key]) {
                keys[`${key}_pressed`] = false;
            }
            return false;
        };

        // Check all directions
        if (checkDoubleTap('w', new THREE.Vector3(0, 0, -1))) return;
        if (checkDoubleTap('s', new THREE.Vector3(0, 0, 1))) return;
        if (checkDoubleTap('a', new THREE.Vector3(-1, 0, 0))) return;
        if (checkDoubleTap('d', new THREE.Vector3(1, 0, 0))) return;
    }

    // Skip normal movement if dodging
    if (player.dodgeState === 'dodging') {
        return;
    }

    player.input.z = (keys['w'] || keys['arrowup']) ? 1 : (keys['s'] || keys['arrowdown']) ? -1 : 0;
    player.input.x = (keys['a'] || keys['arrowleft']) ? -1 : (keys['d'] || keys['arrowright']) ? 1 : 0;

    // Handle virtual joystick input
    if (vj.active) {
        player.input.z = -vj.value.y;
        player.input.x = vj.value.x;
    }

    if (keys[' ']) {
        // Use CombatEngine for attack
        if (window.combatEngine) {
            const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(player.model.position) : null;
            const sourcePos = player.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
            let targetPos;

            if (nearestEnemy) {
                targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
            } else {
                const forward = new THREE.Vector3();
                window.camera.getWorldDirection(forward);
                targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
            }

            window.combatEngine.activeCharacter = player.characterId;
            window.combatEngine.basicAttack(sourcePos, targetPos);
            if (typeof player.attack === 'function') player.attack();
        }
        keys[' '] = false;
    }
    if (keys['1']) {
        if (typeof player.useSkill === 'function') player.useSkill(1);
        keys['1'] = false;
    }
    if (keys['2']) {
        if (window.party && window.party[1] && typeof window.party[1].useSkill === 'function') {
            window.party[1].useSkill(1);
        }
        keys['2'] = false;
    }
    if (keys['3']) {
        if (window.party && window.party[2] && typeof window.party[2].useSkill === 'function') {
            window.party[2].useSkill(1);
        }
        keys['3'] = false;
    }
}

// Candy HUD Button Handlers
// Skill buttons - use CombatEngine with charge support
let chargeTimers = { s1: null, s2: null, s3: null };
let chargeButtons = { s1: null, s2: null, s3: null };

const handleSkillPress = (skillNum, partyIndex) => {
    if (!window.combatEngine || !window.party || !window.party[partyIndex]) return;
    const player = window.party[partyIndex];
    const equippedSkills = window.getEquippedSkills ? window.getEquippedSkills(player.characterId) : [];
    const skill = equippedSkills[skillNum - 1];

    if (!skill) return;

    const btn = document.querySelector(`[data-btn="s${skillNum}"]`);
    if (skill && skill.chargeable) {
        // Start charging
        if (typeof player.startChargeSkill === 'function') {
            player.startChargeSkill(skillNum);
        }
        const key = `s${skillNum}`;
        chargeButtons[key] = btn;
        chargeTimers[key] = setInterval(() => {
            if (window.combatEngine && player && btn) {
                const chargeLevel = window.combatEngine.getChargeLevel();
                // Update button visual
                const pct = chargeLevel * 100;
                btn.style.boxShadow = `0 0 ${10 + pct * 0.5}px rgba(255,255,0,${chargeLevel})`;
            }
        }, 50);
    } else {
        // Instant cast
        if (typeof player.useSkill === 'function') {
            player.useSkill(skillNum);
        }
    }
};

const handleSkillRelease = (skillNum, partyIndex) => {
    if (!window.combatEngine || !window.party || !window.party[partyIndex]) return;
    const player = window.party[partyIndex];
    const key = `s${skillNum}`;

    if (chargeTimers[key]) {
        clearInterval(chargeTimers[key]);
        chargeTimers[key] = null;
        if (chargeButtons[key]) {
            chargeButtons[key].style.boxShadow = '';
        }
        chargeButtons[key] = null;

        // Release charged skill
        if (typeof player.releaseChargeSkill === 'function') {
            player.releaseChargeSkill(skillNum);
        }
    }
};

// Listen for button clicks from candy HUD
window.addEventListener('button:click', (e) => {
    const btnType = e.detail.button;

    switch(btnType) {
        case 's1':
            handleSkillPress(1, 0);
            break;
        case 's2':
            handleSkillPress(1, 1);
            break;
        case 's3':
            handleSkillPress(1, 2);
            break;
        case 'attack':
            // FIX: Ensure CombatEngine exists and target is valid
            if (window.combatEngine && window.party && window.party[0]) {
                const player = window.party[0];
                const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(player.model.position) : null;
                const sourcePos = player.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));

                // Auto-aim or forward aim
                let targetPos;
                if (nearestEnemy) {
                    targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
                    player.model.lookAt(nearestEnemy.model.position); // Face enemy
                } else {
                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.model.quaternion);
                    targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
                }

                window.combatEngine.activeCharacter = player.characterId;
                window.combatEngine.basicAttack(sourcePos, targetPos);

                // Visual Feedback
                if (typeof player.attack === 'function') player.attack();
            }
            break;
        case 'rage':
            if (!window.combatEngine) return;
            if (window.combatEngine.activateRage()) {
                const btn = document.querySelector('[data-btn="rage"]');
                if (btn) {
                    btn.classList.add('active');
                    setTimeout(() => {
                        btn.classList.remove('active');
                    }, 10000);
                }
            }
            break;
        case 'act':
            // FIX: Universal Action (Talk, Open, Loot)
            if (window.UniversalInteractionSystem) {
                const player = window.party && window.party[0] ? window.party[0] : null;
                const result = window.UniversalInteractionSystem.performAction();
                if (!result && window.createFloater && player) {
                    // Feedback if nothing to interact with
                    window.createFloater("Nothing nearby", player.model.position, "#ccc");
                }
            }
            break;
        case 'act2':
            // FIX: Auto-Attack Toggle
            if (window.Game && window.party && window.party[0]) {
                const player = window.party[0];
                window.Game.autoAttack = !window.Game.autoAttack;
                const status = window.Game.autoAttack ? "ON" : "OFF";
                const color = window.Game.autoAttack ? "#00ff00" : "#ff0000";
                if (window.createFloater) window.createFloater(`AUTO ATTACK: ${status}`, player.model.position, color);

                // Visual update for button
                const btn = document.querySelector('button[data-btn="act2"]');
                if (btn) btn.classList.toggle('active', window.Game.autoAttack);
            }
            break;
        case 'jump':
            if (window.party && window.party[0] && typeof window.party[0].jump === 'function') {
                window.party[0].jump();
            }
            break;
        case 'shield':
            if (window.party && window.party[0] && typeof window.party[0].activateShield === 'function') {
                window.party[0].activateShield();
            }
            break;
        case 'bag':
            // Open bag system
            if (window.BagSystem && typeof window.BagSystem.openBag === 'function') {
                window.BagSystem.openBag();
            } else {
                console.warn('Bag System not available');
            }
            break;
        case 'pet':
            // FIX: Toggle Pet
            if (window.A1K_Engine && typeof window.A1K_Engine.togglePet === 'function') {
                window.A1K_Engine.togglePet();
            } else {
                console.warn("Pet system not ready");
            }
            break;
        case 'veh':
            // FIX: Toggle Vehicle
            if (window.A1K_Engine && typeof window.A1K_Engine.toggleVehicle === 'function') {
                window.A1K_Engine.toggleVehicle();
            }
            break;
        case 'ai':
            const panel = document.getElementById('roboxPanel');
            if (panel) panel.classList.toggle('open');
            break;
        case 'switch':
            if(typeof window.switchLeader === 'function') window.switchLeader();
            break;
    }
});

// Handle skill button press/release for chargeable skills
document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('[data-btn^="s"]');
    if (btn) {
        const btnType = btn.dataset.btn;
        if (btnType === 's1') handleSkillPress(1, 0);
        else if (btnType === 's2') handleSkillPress(1, 1);
        else if (btnType === 's3') handleSkillPress(1, 2);
    }
});

document.addEventListener('mouseup', (e) => {
    const btn = e.target.closest('[data-btn^="s"]');
    if (btn) {
        const btnType = btn.dataset.btn;
        if (btnType === 's1') handleSkillRelease(1, 0);
        else if (btnType === 's2') handleSkillRelease(1, 1);
        else if (btnType === 's3') handleSkillRelease(1, 2);
    }
});

document.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('[data-btn^="s"]');
    if (btn) {
        e.preventDefault();
        const btnType = btn.dataset.btn;
        if (btnType === 's1') handleSkillPress(1, 0);
        else if (btnType === 's2') handleSkillPress(1, 1);
        else if (btnType === 's3') handleSkillPress(1, 2);
    }
});

document.addEventListener('touchend', (e) => {
    const btn = e.target.closest('[data-btn^="s"]');
    if (btn) {
        e.preventDefault();
        const btnType = btn.dataset.btn;
        if (btnType === 's1') handleSkillRelease(1, 0);
        else if (btnType === 's2') handleSkillRelease(1, 1);
        else if (btnType === 's3') handleSkillRelease(1, 2);
    }
});

// Command Menu toggle
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
        const menu = document.getElementById('command-menu');
        if (menu) {
            const isVisible = menu.style.display === 'flex';
            menu.style.display = isVisible ? 'none' : 'flex';
        }
    }
});

// Command Menu buttons
document.getElementById('respec-btn')?.addEventListener('click', () => {
    console.log("SYSTEM: Arcade System -> Power Respec triggered. Cost: 100 Source Marks.");
    if (window.gameState) {
        window.gameState.sourceMarks = (window.gameState.sourceMarks || 0) - 100;
    }
});

document.getElementById('craft-btn')?.addEventListener('click', () => {
    console.log("SYSTEM: Alchemy System -> Crafted Power Boost. Cost: 5 Exobits.");
    if (window.gameState) {
        window.gameState.exobits = (window.gameState.exobits || 0) - 5;
    }
});

document.getElementById('cape-toggle-btn')?.addEventListener('click', () => {
    console.log("SYSTEM: Skin System -> Toggling cape visibility.");
    if (window.party) {
        const a1 = window.party.find(p => p.name === 'A1');
        if (a1 && a1.model && a1.model.userData && a1.model.userData.sword) {
            // Toggle cape if it exists
            if (a1.model.cape) {
                a1.model.cape.visible = !a1.model.cape.visible;
            }
        }
    }
});

// UI Update Function
function updateUI() {
    if (!window.party || !window.party[0] || !window.combatEngine) return;

    const player = window.party[0];

    // Update HP display
    const hpDisplay = document.getElementById('hp-display');
    const maxHpDisplay = document.getElementById('maxhp-display');
    if (hpDisplay) hpDisplay.textContent = Math.floor(player.health || 1000);
    if (maxHpDisplay) maxHpDisplay.textContent = Math.floor(player.maxHealth || 1000);

    // Update Rage and Combo
    const rageDisplay = document.getElementById('rage-display');
    const comboDisplay = document.getElementById('combo-display');
    if (rageDisplay) rageDisplay.textContent = Math.floor(window.combatEngine.rage);
    if (comboDisplay) {
        comboDisplay.textContent = window.combatEngine.combo;
        // Visual feedback for high combos
        if (window.combatEngine.combo >= 50) {
            comboDisplay.style.color = '#ffaa00';
            comboDisplay.style.textShadow = '0 0 10px #ffaa00';
        } else if (window.combatEngine.combo >= 10) {
            comboDisplay.style.color = '#ffff00';
            comboDisplay.style.textShadow = '0 0 5px #ffff00';
        } else {
            comboDisplay.style.color = '#fff';
            comboDisplay.style.textShadow = 'none';
        }
    }

    // Update Rage button state (candy HUD)
    const btnRage = document.querySelector('[data-btn="rage"]');
    if (btnRage && window.combatEngine) {
        if (window.combatEngine.rage >= 100) {
            btnRage.style.opacity = '1';
            btnRage.style.cursor = 'pointer';
        } else {
            btnRage.style.opacity = '0.5';
            btnRage.style.cursor = 'not-allowed';
        }
        if (window.combatEngine.rageActive) {
            btnRage.classList.add('active');
        } else {
            btnRage.classList.remove('active');
        }
    }

    // Update XP display
    const xpDisplay = document.getElementById('xp-display');
    if (xpDisplay && window.gameState) {
        xpDisplay.textContent = `XP: ${window.gameState.xp || 0} | SM: ${window.gameState.sourceMarks || 0} | EX: ${window.gameState.exobits || 0} | G: ${window.gameState.gold || 0}`;
    }

    // Update skill cooldowns using HUD API
    if (window.HUD && window.equippedSkills) {
        // S1 - Player's first skill
        const s1SkillId = window.equippedSkills[player.characterId]?.[0];
        if (s1SkillId) {
            const cdInfo = window.combatEngine.getSkillCooldown(s1SkillId);
            window.HUD.setSkillReady('S1', cdInfo.isReady);
        }

        // S2 - Second party member's first skill
        if (window.party && window.party[1]) {
            const s2SkillId = window.equippedSkills[window.party[1].characterId]?.[0];
            if (s2SkillId) {
                const cdInfo = window.combatEngine.getSkillCooldown(s2SkillId);
                window.HUD.setSkillReady('S2', cdInfo.isReady);
            }
        }

        // S3 - Third party member's first skill
        if (window.party && window.party[2]) {
            const s3SkillId = window.equippedSkills[window.party[2].characterId]?.[0];
            if (s3SkillId) {
                const cdInfo = window.combatEngine.getSkillCooldown(s3SkillId);
                window.HUD.setSkillReady('S3', cdInfo.isReady);
            }
        }
    }

    // Update skill cooldown text displays (keep for game-info HUD)
    const s1Cd = document.getElementById('s1-cd');
    const s2Cd = document.getElementById('s2-cd');
    const s3Cd = document.getElementById('s3-cd');

    if (s1Cd && window.equippedSkills && window.equippedSkills[player.characterId]?.[0]) {
        const cdInfo = window.combatEngine.getSkillCooldown(window.equippedSkills[player.characterId][0]);
        s1Cd.textContent = cdInfo.isReady ? 'Ready' : cdInfo.remaining.toFixed(1) + 's';
        s1Cd.style.color = cdInfo.isReady ? '#00ff00' : '#ff6666';
    }
    if (s2Cd && window.equippedSkills && window.equippedSkills[window.party?.[1]?.characterId]?.[0]) {
        const cdInfo = window.combatEngine.getSkillCooldown(window.equippedSkills[window.party[1].characterId][0]);
        s2Cd.textContent = cdInfo.isReady ? 'Ready' : cdInfo.remaining.toFixed(1) + 's';
        s2Cd.style.color = cdInfo.isReady ? '#00ff00' : '#ff6666';
    }
    if (s3Cd && window.equippedSkills && window.equippedSkills[window.party?.[2]?.characterId]?.[0]) {
        const cdInfo = window.combatEngine.getSkillCooldown(window.equippedSkills[window.party[2].characterId][0]);
        s3Cd.textContent = cdInfo.isReady ? 'Ready' : cdInfo.remaining.toFixed(1) + 's';
        s3Cd.style.color = cdInfo.isReady ? '#00ff00' : '#ff6666';
    }
}

// Hook into main animation loop to call handleInput and updateUI
// This will be called from game-core.js animate function
if (window.animate) {
    // Store original animate function
    const originalAnimate = window.animate;

    // Wrap animate to include input handling and UI updates
    window.animate = function() {
        // Call handleInput before the main loop
        handleInput();

        // Call original animate
        originalAnimate();

        // Call updateUI after rendering
        updateUI();
    };
} else {
    // If animate doesn't exist yet, set up to be called later
    // This will be handled by game-core.js
}

// Export to window for global access
window.handleInput = handleInput;
window.updateUI = updateUI;
window.vj = vj;
