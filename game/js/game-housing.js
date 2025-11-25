// Phase 22: Housing & Territory System
const HousingSystem = {
    ownedBuildings: [],

    init: () => {
        // Load owned buildings from save
        if (window.gameState && window.gameState.ownedBuildings) {
            HousingSystem.ownedBuildings = window.gameState.ownedBuildings;
        } else {
            window.gameState.ownedBuildings = [];
        }

        // Mark owned buildings visually
        HousingSystem.updateOwnedBuildingsVisuals();

        console.log('[HousingSystem] Initialized');
    },

    // Show purchase UI
    showPurchaseUI: (buildingMesh, price) => {
        const buildingId = buildingMesh.userData.id || `building_${buildingMesh.uuid}`;

        // Check if already owned
        if (HousingSystem.ownedBuildings.includes(buildingId)) {
            // Enter interior
            HousingSystem.enterInterior(buildingId);
            return;
        }

        // Create purchase UI
        const ui = document.createElement('div');
        ui.id = 'housing-purchase-ui';
        ui.innerHTML = `
            <div class="housing-purchase-container">
                <h3>Purchase Property</h3>
                <p>Price: ${price.toLocaleString()} Gold</p>
                <div class="housing-controls">
                    <button class="housing-btn buy" id="housing-buy-btn">Buy</button>
                    <button class="housing-btn cancel" id="housing-cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff00;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            color: #fff;
            font-family: 'Segoe UI', sans-serif;
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .housing-purchase-container h3 { margin: 0 0 12px 0; color: #00ff00; }
            .housing-purchase-container p { margin: 0 0 20px 0; font-size: 18px; }
            .housing-controls { display: flex; gap: 10px; }
            .housing-btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .housing-btn.buy { background: #00ff00; color: #000; }
            .housing-btn.cancel { background: #666; color: #fff; }
        `;
        if (!document.getElementById('housing-styles')) {
            style.id = 'housing-styles';
            document.head.appendChild(style);
        }

        document.body.appendChild(ui);

        // Event listeners
        document.getElementById('housing-buy-btn').addEventListener('click', () => {
            HousingSystem.purchaseBuilding(buildingId, buildingMesh, price);
            document.body.removeChild(ui);
        });
        document.getElementById('housing-cancel-btn').addEventListener('click', () => {
            document.body.removeChild(ui);
        });
    },

    // Purchase building
    purchaseBuilding: (buildingId, buildingMesh, price) => {
        if (!window.gameState) return false;

        const gold = window.gameState.gold || 0;
        if (gold < price) {
            if (window.createFloater && window.party && window.party[0]) {
                window.createFloater("Not enough gold!", window.party[0].model.position, "#ff0000");
            }
            return false;
        }

        // Deduct gold
        window.gameState.gold = gold - price;

        // Add to owned buildings
        if (!HousingSystem.ownedBuildings.includes(buildingId)) {
            HousingSystem.ownedBuildings.push(buildingId);
        }

        // Save
        if (window.gameState) {
            window.gameState.ownedBuildings = HousingSystem.ownedBuildings;
        }

        // Visual feedback
        if (buildingMesh.material) {
            buildingMesh.material.color.setHex(0x00ff00); // Green for owned
            buildingMesh.material.emissive = new THREE.Color(0x00ff00);
            buildingMesh.material.emissiveIntensity = 0.3;
        }

        if (window.createFloater && window.party && window.party[0]) {
            window.createFloater("Property Purchased!", window.party[0].model.position, "#00ff00");
        }

        console.log(`[HousingSystem] Purchased building: ${buildingId}`);
        return true;
    },

    // Phase 22.2: Enter interior instance
    enterInterior: (buildingId) => {
        if (!HousingSystem.ownedBuildings.includes(buildingId)) {
            console.warn(`[HousingSystem] Building ${buildingId} not owned`);
            return;
        }

        // Save current position
        if (window.party && window.party[0] && window.party[0].model) {
            if (!window.gameState.interiorState) window.gameState.interiorState = {};
            window.gameState.interiorState.lastPosition = window.party[0].model.position.clone();
        }

        // Create interior scene
        HousingSystem.createInterior(buildingId);

        // Teleport player to interior
        if (window.party && window.party[0] && window.party[0].model) {
            window.party[0].model.position.set(0, 0, 0);
        }

        console.log(`[HousingSystem] Entered interior: ${buildingId}`);
    },

    // Create interior instance
    createInterior: (buildingId) => {
        if (!window.Game || !window.Game.scene) return;

        // Clear exterior objects (temporarily hide)
        const toHide = [];
        window.Game.scene.children.forEach(child => {
            if (child.userData && !child.userData.isInteriorObject) {
                child.visible = false;
                toHide.push(child);
            }
        });
        window.Game.interiorHiddenObjects = toHide;

        // Create interior room
        const interiorGroup = new THREE.Group();
        interiorGroup.userData.isInteriorObject = true;

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        interiorGroup.add(floor);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
        const walls = [
            { pos: [0, 2, -5], size: [10, 4, 0.2] }, // Back
            { pos: [0, 2, 5], size: [10, 4, 0.2] },  // Front
            { pos: [-5, 2, 0], size: [0.2, 4, 10] }, // Left
            { pos: [5, 2, 0], size: [0.2, 4, 10] }   // Right
        ];
        walls.forEach(wall => {
            const wallMesh = new THREE.Mesh(
                new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]),
                wallMat
            );
            wallMesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            interiorGroup.add(wallMesh);
        });

        // Exit portal
        const exitPortal = new THREE.Mesh(
            new THREE.RingGeometry(0.8, 1.0, 16),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8
            })
        );
        exitPortal.rotation.x = Math.PI / 2;
        exitPortal.position.set(0, 0.1, 4.5);
        exitPortal.userData.isExitPortal = true;
        exitPortal.userData.onInteract = () => {
            HousingSystem.exitInterior();
        };
        interiorGroup.add(exitPortal);

        window.Game.scene.add(interiorGroup);
        window.Game.currentInterior = interiorGroup;

        // Add to interactables
        if (!window.Game.interactables) window.Game.interactables = [];
        window.Game.interactables.push(exitPortal);
    },

    // Exit interior
    exitInterior: () => {
        if (!window.Game || !window.Game.scene) return;

        // Remove interior
        if (window.Game.currentInterior) {
            window.Game.scene.remove(window.Game.currentInterior);
            window.Game.currentInterior = null;
        }

        // Restore exterior objects
        if (window.Game.interiorHiddenObjects) {
            window.Game.interiorHiddenObjects.forEach(obj => {
                obj.visible = true;
            });
            window.Game.interiorHiddenObjects = null;
        }

        // Restore player position
        if (window.gameState && window.gameState.interiorState && window.gameState.interiorState.lastPosition) {
            if (window.party && window.party[0] && window.party[0].model) {
                window.party[0].model.position.copy(window.gameState.interiorState.lastPosition);
            }
        }

        console.log('[HousingSystem] Exited interior');
    },

    // Phase 22.3: Furniture placement (grid-based)
    placeFurniture: (furnitureId, position) => {
        // Grid snapping
        const gridSize = 1.0;
        const snappedX = Math.round(position.x / gridSize) * gridSize;
        const snappedZ = Math.round(position.z / gridSize) * gridSize;

        // Create furniture mesh
        // Implementation would create furniture object at snapped position
        console.log(`[HousingSystem] Placed furniture ${furnitureId} at (${snappedX}, ${snappedZ})`);
    },

    // Update owned buildings visuals
    updateOwnedBuildingsVisuals: () => {
        if (!window.EnvSystem || !window.EnvSystem.objects) return;

        window.EnvSystem.objects.forEach(obj => {
            if (obj.userData && obj.userData.id === 'house_small') {
                const buildingId = `building_${obj.uuid}`;
                if (HousingSystem.ownedBuildings.includes(buildingId)) {
                    if (obj.material) {
                        obj.material.color.setHex(0x00ff00);
                        obj.material.emissive = new THREE.Color(0x00ff00);
                        obj.material.emissiveIntensity = 0.3;
                    }
                }
            }
        });
    }
};

window.HousingSystem = HousingSystem;

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        HousingSystem.init();
    });
} else {
    HousingSystem.init();
}
