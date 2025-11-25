// Phase 21: Narrative Engine - NPCs & Dialogue System
// This module handles NPC spawning, dialogue, and quest management

// Phase 21.1: NPC System
const NPCSystem = {
    npcs: [],

    // NPC data definitions
    npcDatabase: {
        'guard_01': {
            id: 'guard_01',
            name: 'City Guard',
            icon: '🛡️',
            dialogue: [
                "Welcome to the city, traveler.",
                "Stay safe out there. The streets can be dangerous.",
                "If you need supplies, check the shops in the market district.",
                "I've heard rumors of portals appearing in the city...",
                "Be careful if you see any strange purple portals.",
                "The Breach has been causing trouble lately."
            ],
            position: null // Will be set when spawned
        },
        'merchant_01': {
            id: 'merchant_01',
            name: 'Merchant',
            icon: '💰',
            dialogue: [
                "Welcome to my shop!",
                "I have the finest goods in the city.",
                "Come back anytime you need supplies.",
                "Looking for materials? I can help with that.",
                "Evolution Stones are rare, but I might have one...",
                "Check my inventory for crafting materials!"
            ],
            position: null
        },
        'quest_giver_01': {
            id: 'quest_giver_01',
            name: 'Quest Master',
            icon: '📜',
            dialogue: [
                "Ah, a new adventurer!",
                "I have a task for you: Clear The Breach dungeon.",
                "Return to me when you've completed it.",
                "The dungeon contains powerful enemies and great rewards.",
                "Make sure you're well-equipped before entering.",
                "Complete quests to unlock new content!"
            ],
            questId: 'breach_clearance',
            position: null
        },
        // Quick Feature 3: More NPCs with dialogue
        'blacksmith_01': {
            id: 'blacksmith_01',
            name: 'Blacksmith',
            icon: '⚒️',
            dialogue: [
                "Welcome to my forge!",
                "I can upgrade your weapons and armor.",
                "Dismantle old gear to get materials.",
                "Craft powerful items with the right materials.",
                "Bring me scrap and essence for crafting!"
            ],
            position: null
        },
        'trainer_01': {
            id: 'trainer_01',
            name: 'Combat Trainer',
            icon: '🥋',
            dialogue: [
                "Want to improve your combat skills?",
                "Master elemental reactions for massive damage!",
                "Try combining Fire and Lightning for Overload.",
                "Ice and Lightning create Superconduct.",
                "Practice your combos to build reaction chains!"
            ],
            position: null
        }
    },

    // Spawn NPC at position
    spawn: (npcId, position) => {
        if (!window.Game || !window.Game.scene) return null;

        const npcData = NPCSystem.npcDatabase[npcId];
        if (!npcData) {
            console.warn(`[NPCSystem] NPC ${npcId} not found in database`);
            return null;
        }

        // Create NPC mesh (simple character model)
        const npcGroup = new THREE.Group();

        // Body
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            roughness: 0.7
        });
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.6, 0.5),
            bodyMat
        );
        body.position.y = 0.8;
        npcGroup.add(body);

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16),
            bodyMat
        );
        head.position.y = 2.0;
        npcGroup.add(head);

        // Icon indicator above head
        const iconSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: NPCSystem.createIconTexture(npcData.icon),
                transparent: true,
                sizeAttenuation: false
            })
        );
        iconSprite.scale.set(1, 1, 1);
        iconSprite.position.y = 2.8;
        npcGroup.add(iconSprite);

        // Interaction marker (glowing ring)
        const marker = new THREE.Mesh(
            new THREE.RingGeometry(0.6, 0.8, 16),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            })
        );
        marker.rotation.x = -Math.PI / 2;
        marker.position.y = 0.05;
        npcGroup.add(marker);

        // Animate marker
        const animateMarker = () => {
            if (marker && marker.parent) {
                marker.rotation.z += 0.02;
                marker.material.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
                requestAnimationFrame(animateMarker);
            }
        };
        animateMarker();

        npcGroup.position.copy(position);
        npcGroup.castShadow = true;
        npcGroup.receiveShadow = true;

        // Store NPC data
        npcGroup.userData = {
            type: 'npc',
            npcId: npcId,
            npcData: npcData,
            interactable: true,
            onInteract: () => {
                if (window.DialogueSystem) {
                    window.DialogueSystem.startDialogue(npcId);
                }
            }
        };

        npcData.position = position;
        NPCSystem.npcs.push(npcGroup);
        window.Game.scene.add(npcGroup);

        // Add to interactables list
        if (!window.Game.interactables) window.Game.interactables = [];
        window.Game.interactables.push(npcGroup);

        console.log(`[NPCSystem] Spawned NPC: ${npcData.name} at`, position);
        return npcGroup;
    },

    // Create icon texture for sprite
    createIconTexture: (icon) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    },

    // Get NPC by ID
    getNPC: (npcId) => {
        return NPCSystem.npcs.find(npc =>
            npc.userData && npc.userData.npcId === npcId
        );
    },

    // Update NPCs (animations, etc.)
    update: (dt) => {
        // Can add idle animations here
    }
};

window.NPCSystem = NPCSystem;
