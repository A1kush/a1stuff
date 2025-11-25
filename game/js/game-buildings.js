// Phase: Building System Integration from a1 city 2.html
// Extracts 14 original buildings and integrates them into 3D world
// Enhanced with doors, windows, physics, and random house spawning

const BuildingSystem = {
    // Array of 14 building definitions (filtered from a1 city 2.html)
    buildings: [
        {
            id: "photo",
            name: "Photo Booth",
            type: "photo",
            zone: "ENTRY",
            x: 260,
            y: 920, // stripY
            width: 80,
            height: 120,
            color: "#9A6BFF",
            roof: "#7e5bef",
        },
        {
            id: "arena",
            name: "Battle Arena",
            type: "arena",
            zone: "TRAIN",
            x: 900,
            y: 920,
            width: 140,
            height: 160,
            color: "#ef4444",
            roof: "#b91c1c",
            npc: "Arena Master",
        },
        {
            id: "quest",
            name: "Quest Board",
            type: "quest",
            zone: "PLAZA",
            x: 1500,
            y: 920,
            width: 100,
            height: 120,
            color: "#22d3ee",
            roof: "#06b6d4",
        },
        {
            id: "archives",
            name: "Archives",
            type: "archives",
            zone: "PLAZA",
            x: 1650,
            y: 920,
            width: 140,
            height: 160,
            color: "#94a3b8",
            roof: "#64748b",
            npc: "Librarian",
        },
        {
            id: "home",
            name: "Your Home",
            type: "house",
            zone: "HOME_ROW",
            x: 2000,
            y: 920,
            width: 120,
            height: 140,
            color: "#ff93d3",
            roof: "#d15aa8",
            npc: "Roomie",
        },
        {
            id: "mail",
            name: "Mail Center",
            type: "mail",
            zone: "HOME_ROW",
            x: 2200,
            y: 920,
            width: 100,
            height: 120,
            color: "#60a5fa",
            roof: "#2563eb",
        },
        {
            id: "shop",
            name: "Item Shop",
            type: "shop",
            zone: "MARKET",
            x: 2600,
            y: 920,
            width: 130,
            height: 140,
            color: "#9fd7ff",
            roof: "#60a5fa",
            npc: "Merchant Mints",
        },
        {
            id: "forge",
            name: "Blacksmith Forge",
            type: "forge",
            zone: "MARKET",
            x: 2750,
            y: 920,
            width: 120,
            height: 140,
            color: "#f97316",
            roof: "#c2410c",
            npc: "Blacksmith",
        },
        {
            id: "apothecary",
            name: "Apothecary",
            type: "apothecary",
            zone: "MARKET",
            x: 2890,
            y: 920,
            width: 140,
            height: 140,
            color: "#84cc16",
            roof: "#4d7c0f",
            npc: "Herbalist",
        },
        {
            id: "black_market",
            name: "Black Market",
            type: "black_market",
            zone: "ARCADE",
            x: 3300,
            y: 920,
            width: 140,
            height: 140,
            color: "#0ea5e9",
            roof: "#0369a1",
            npc: "Shady Dealer",
        },
        {
            id: "workshop",
            name: "Workshop",
            type: "workshop",
            zone: "SKY_RAIL",
            x: 5100,
            y: 920,
            width: 140,
            height: 140,
            color: "#eab308",
            roof: "#a16207",
            npc: "Engineer",
        },
        {
            id: "shrine",
            name: "Divine Shrine",
            type: "shrine",
            zone: "GARDEN",
            x: 5700,
            y: 920,
            width: 140,
            height: 140,
            color: "#22c55e",
            roof: "#15803d",
            npc: "Priestess",
        },
        {
            id: "tower_gate",
            name: "Candy Tower Gate",
            type: "gate",
            zone: "TOWER_GATE",
            x: 3900,
            y: 920,
            width: 160,
            height: 220,
            color: "#9ca3af",
            roof: "#6b7280",
            npc: "Gatekeeper",
        },
        {
            id: "boss_tower",
            name: "Boss Tower",
            type: "boss",
            zone: "BOSS_TOWER",
            x: 6300,
            y: 920,
            width: 180,
            height: 280,
            color: "#ef4444",
            roof: "#7f1d1d",
        },
    ],

    // Discovery and visit tracking
    discoveredBuildings: new Set(),
    visitedBuildings: new Set(),
    currentBuilding: null,
    buildingMeshes: new Map(),

    // UI elements
    discoveryCounterElement: null,
    entryPromptElement: null,
    lastDiscoveryCheck: 0,
    discoveryCheckInterval: 1000, // Check every 1 second

    // Initialize the building system
    init: function() {
        if (!window.Game || !window.Game.scene) {
            console.warn('[BuildingSystem] Game not ready, will retry');
            return;
        }

        // Load saved discovery/visit data
        if (window.gameState && window.gameState.buildings) {
            const saved = window.gameState.buildings;
            if (saved.discovered && Array.isArray(saved.discovered)) {
                this.discoveredBuildings = new Set(saved.discovered);
            }
            if (saved.visited && Array.isArray(saved.visited)) {
                this.visitedBuildings = new Set(saved.visited);
            }
        } else {
            // Initialize gameState.buildings if it doesn't exist
            if (!window.gameState) window.gameState = {};
            window.gameState.buildings = { discovered: [], visited: [] };
        }

        // Create UI elements
        this.createUIElements();

        console.log('[BuildingSystem] Initialized with', this.buildings.length, 'buildings');
    },

    // Convert 2D canvas coordinates to 3D world positions
    convert2DTo3D: function(building) {
        // Scale factor: 2D canvas (0-7000) to 3D world (-100 to 100)
        // Center point: 3500 in 2D = 0 in 3D
        const centerX = 3500; // Center of 2D map
        const scaleFactor = 35; // 7000 / 200 = 35

        // Convert x: 2D canvas x to 3D world x (centered around 0)
        const worldX = (building.x - centerX) / scaleFactor;

        // Convert y: 2D canvas y (stripY = 920) to 3D world z
        // All buildings are at stripY, so we center them around z = 0
        const worldZ = (building.y - 920) / scaleFactor; // Should be ~0 for all buildings

        // Convert dimensions: width/height (80-280) to 3D scale (divide by 12)
        const scaleX = building.width / 12;
        const scaleY = building.height / 12;
        const scaleZ = building.width / 12; // Square buildings (depth = width)

        return {
            position: { x: worldX, y: scaleY / 2, z: worldZ },
            scale: { x: scaleX, y: scaleY, z: scaleZ }
        };
    },

    // Create 3D mesh for a building with doors and windows
    createBuildingMesh: function(building) {
        const converted = this.convert2DTo3D(building);

        // Create main building body
        const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: building.color,
            roughness: 0.8,
            metalness: 0.2
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.scale.set(converted.scale.x, converted.scale.y, converted.scale.z);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;

        // Combine into group
        const buildingGroup = new THREE.Group();
        buildingGroup.add(bodyMesh);

        // Add door to front face
        const doorWidth = Math.min(converted.scale.x * 0.3, 1.5);
        const doorHeight = converted.scale.y * 0.5;
        const doorGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x4a2c1a, // Brown door
            roughness: 0.9
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, doorHeight / 2, converted.scale.z / 2 + 0.01); // Front face
        door.rotation.y = Math.PI; // Face outward
        door.castShadow = true;
        buildingGroup.add(door);

        // Add door frame
        const frameThickness = 0.1;
        const frameGeo = new THREE.BoxGeometry(doorWidth + frameThickness * 2, doorHeight + frameThickness * 2, frameThickness);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0f, roughness: 0.8 });
        const doorFrame = new THREE.Mesh(frameGeo, frameMat);
        doorFrame.position.set(0, doorHeight / 2, converted.scale.z / 2 + 0.005);
        buildingGroup.add(doorFrame);

        // Add windows (2-4 windows per building face)
        const windowCount = Math.floor(2 + Math.random() * 3);
        const windowSpacing = converted.scale.x / (windowCount + 1);
        const windowSize = Math.min(windowSpacing * 0.6, 1.0);
        const windowHeight = converted.scale.y * 0.3;
        const windowY = converted.scale.y * 0.6; // Upper height

        // Front windows
        for (let i = 0; i < windowCount; i++) {
            const windowGeo = new THREE.PlaneGeometry(windowSize, windowHeight);
            const windowMat = new THREE.MeshStandardMaterial({
                color: 0x87ceeb, // Sky blue
                emissive: 0x222244,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const window = new THREE.Mesh(windowGeo, windowMat);
            const windowX = (i + 1) * windowSpacing - converted.scale.x / 2;
            window.position.set(windowX, windowY, converted.scale.z / 2 + 0.01);
            window.rotation.y = Math.PI;
            buildingGroup.add(window);

            // Window frame
            const winFrameGeo = new THREE.BoxGeometry(windowSize + 0.05, windowHeight + 0.05, 0.05);
            const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
            const winFrame = new THREE.Mesh(winFrameGeo, winFrameMat);
            winFrame.position.set(windowX, windowY, converted.scale.z / 2 + 0.005);
            buildingGroup.add(winFrame);
        }

        // Side windows (left and right faces)
        const sideWindowCount = Math.floor(1 + Math.random() * 2);
        for (let i = 0; i < sideWindowCount; i++) {
            const windowGeo = new THREE.PlaneGeometry(windowSize, windowHeight);
            const windowMat = new THREE.MeshStandardMaterial({
                color: 0x87ceeb,
                emissive: 0x222244,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            const windowZ = (i + 1) * (converted.scale.z / (sideWindowCount + 1)) - converted.scale.z / 2;

            // Right side window
            const windowRight = new THREE.Mesh(windowGeo, windowMat);
            windowRight.position.set(converted.scale.x / 2 + 0.01, windowY, windowZ);
            windowRight.rotation.y = -Math.PI / 2; // Face right
            buildingGroup.add(windowRight);

            // Right side window frame
            const winFrameRight = new THREE.Mesh(
                new THREE.BoxGeometry(windowSize + 0.05, windowHeight + 0.05, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
            );
            winFrameRight.position.set(converted.scale.x / 2 + 0.005, windowY, windowZ);
            buildingGroup.add(winFrameRight);

            // Left side window
            const windowLeft = new THREE.Mesh(windowGeo, windowMat);
            windowLeft.position.set(-converted.scale.x / 2 - 0.01, windowY, windowZ);
            windowLeft.rotation.y = Math.PI / 2; // Face left
            buildingGroup.add(windowLeft);

            // Left side window frame
            const winFrameLeft = new THREE.Mesh(
                new THREE.BoxGeometry(windowSize + 0.05, windowHeight + 0.05, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
            );
            winFrameLeft.position.set(-converted.scale.x / 2 - 0.005, windowY, windowZ);
            buildingGroup.add(winFrameLeft);
        }

        // Create roof based on building type
        let roofMesh = null;
        const roofColor = building.roof || building.color;

        // Towers and gates get flat roofs, others get peaked roofs
        if (building.type === 'boss' || building.type === 'gate') {
            // Flat roof
            const roofGeo = new THREE.BoxGeometry(1, 0.2, 1);
            const roofMat = new THREE.MeshStandardMaterial({
                color: roofColor,
                roughness: 0.7
            });
            roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.scale.set(converted.scale.x * 1.1, 1, converted.scale.z * 1.1);
            roofMesh.position.y = converted.scale.y / 2 + 0.1;
        } else {
            // Peaked roof (pyramid)
            const roofHeight = Math.min(converted.scale.x, converted.scale.z) * 0.4;
            const roofGeo = new THREE.ConeGeometry(
                Math.max(converted.scale.x, converted.scale.z) * 0.7,
                roofHeight,
                4
            );
            const roofMat = new THREE.MeshStandardMaterial({
                color: roofColor,
                roughness: 0.7
            });
            roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.rotation.y = Math.PI / 4; // Rotate 45 degrees for diamond shape
            roofMesh.position.y = converted.scale.y / 2 + roofHeight / 2;
            roofMesh.castShadow = true;
        }
        if (roofMesh) buildingGroup.add(roofMesh);

        // Position the group
        buildingGroup.position.set(
            converted.position.x,
            converted.position.y,
            converted.position.z
        );

        // Add collision box for physics
        const collisionBox = new THREE.Box3().setFromObject(buildingGroup);
        buildingGroup.userData.collisionBox = collisionBox;
        buildingGroup.userData.isPhysical = true; // Mark as physical object
        bodyMesh.userData.isPhysical = true;
        bodyMesh.userData.collisionBox = collisionBox;

        // Store building data in userData
        buildingGroup.userData = {
            ...buildingGroup.userData,
            buildingId: building.id,
            buildingType: building.type,
            buildingName: building.name,
            hasInterior: true,
            npc: building.npc || null,
            isBuilding: true,
            type: 'building',
            building: building // Store full building object
        };

        return buildingGroup;
    },

    // Spawn all buildings in the 3D world
    spawnAllBuildings: function() {
        if (!window.Game || !window.Game.scene) {
            console.warn('[BuildingSystem] Cannot spawn buildings: Game not ready');
            return;
        }

        this.buildings.forEach(building => {
            const mesh = this.createBuildingMesh(building);
            window.Game.scene.add(mesh);
            this.buildingMeshes.set(building.id, mesh);

            // Add to interactables
            if (!window.Game.interactables) window.Game.interactables = [];
            window.Game.interactables.push(mesh);
        });

        console.log('[BuildingSystem] Spawned', this.buildings.length, 'buildings');

        // Spawn random houses around the map (spread across entire map)
        this.spawnRandomHouses(40);

        // Spawn trees across the map
        this.spawnRandomTrees(60);
    },

    // Spawn random houses around the map
    spawnRandomHouses: function(count = 40) {
        if (!window.Game || !window.Game.scene || !window.EnvSystem) {
            console.warn('[BuildingSystem] Cannot spawn random houses: Systems not ready');
            return;
        }

        // Spread houses across entire map area using grid-based distribution
        const mapSize = 200; // Map extends from -100 to +100 in both X and Z
        const minDistance = 15; // Minimum distance between houses
        const minDistanceFromBuildings = 25; // Distance from main buildings
        const avoidCenterRadius = 20; // Avoid center spawn area

        const spawnedPositions = [];

        // Create a grid to ensure even distribution
        const gridSize = Math.ceil(Math.sqrt(count * 1.5)); // Slightly larger grid for better spacing
        const cellSize = mapSize / gridSize;

        // Create list of all possible grid cells
        const gridCells = [];
        for (let z = 0; z < gridSize; z++) {
            for (let x = 0; x < gridSize; x++) {
                gridCells.push({ x, z });
            }
        }

        // Shuffle grid cells for randomness
        for (let i = gridCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gridCells[i], gridCells[j]] = [gridCells[j], gridCells[i]];
        }

        // Try to place houses in shuffled grid cells
        for (let i = 0; i < Math.min(count, gridCells.length); i++) {
            const cell = gridCells[i];

            // Calculate cell center position
            const cellCenterX = (cell.x - gridSize / 2) * cellSize + cellSize / 2;
            const cellCenterZ = (cell.z - gridSize / 2) * cellSize + cellSize / 2;

            // Add random offset within cell (but not too close to edges)
            const offsetRange = cellSize * 0.4; // Use 40% of cell for random offset
            const randomOffsetX = (Math.random() - 0.5) * offsetRange;
            const randomOffsetZ = (Math.random() - 0.5) * offsetRange;

            const position = new THREE.Vector3(
                cellCenterX + randomOffsetX,
                0,
                cellCenterZ + randomOffsetZ
            );

            // Clamp to map bounds
            position.x = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, position.x));
            position.z = Math.max(-mapSize/2 + 10, Math.min(mapSize/2 - 10, position.z));

            // Check if position is valid
            const distFromOrigin = Math.sqrt(position.x * position.x + position.z * position.z);
            if (distFromOrigin < avoidCenterRadius) {
                continue; // Skip center area
            }

            // Check distance from other houses
            const tooCloseToHouse = spawnedPositions.some(pos =>
                position.distanceTo(pos) < minDistance
            );
            if (tooCloseToHouse) {
                continue; // Skip if too close to another house
            }

            // Check distance from BuildingSystem buildings
            const tooCloseToBuilding = Array.from(this.buildingMeshes.values()).some(mesh =>
                position.distanceTo(mesh.position) < minDistanceFromBuildings
            );
            if (tooCloseToBuilding) {
                continue; // Skip if too close to main buildings
            }

            // Spawn house at valid position
            const house = window.EnvSystem.spawn('house_small', position);
            if (house) {
                spawnedPositions.push(position);
                console.log(`[BuildingSystem] Spawned house at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
            }
        }

        console.log('[BuildingSystem] Spawned', spawnedPositions.length, 'random houses spread across the entire map');
    },

    // Spawn trees across the map
    spawnRandomTrees: function(count = 60) {
        if (!window.Game || !window.Game.scene || !window.EnvSystem) {
            console.warn('[BuildingSystem] Cannot spawn trees: Systems not ready');
            return;
        }

        const mapSize = 200;
        const minDistance = 8; // Trees can be closer together
        const minDistanceFromBuildings = 10; // Distance from buildings
        const minDistanceFromHouses = 8; // Distance from houses
        const avoidCenterRadius = 15;

        const spawnedPositions = [];

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let position;
            let validPosition = false;

            while (attempts < 150 && !validPosition) {
                // Random position across map
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * mapSize,
                    0,
                    (Math.random() - 0.5) * mapSize
                );

                // Clamp to map bounds
                position.x = Math.max(-mapSize/2 + 5, Math.min(mapSize/2 - 5, position.x));
                position.z = Math.max(-mapSize/2 + 5, Math.min(mapSize/2 - 5, position.z));

                // Avoid center
                const distFromOrigin = Math.sqrt(position.x * position.x + position.z * position.z);
                if (distFromOrigin < avoidCenterRadius) {
                    attempts++;
                    continue;
                }

                // Check distance from other trees
                validPosition = spawnedPositions.every(pos =>
                    position.distanceTo(pos) >= minDistance
                );

                // Check distance from BuildingSystem buildings
                if (validPosition) {
                    validPosition = Array.from(this.buildingMeshes.values()).every(mesh =>
                        position.distanceTo(mesh.position) >= minDistanceFromBuildings
                    );
                }

                // Check distance from EnvSystem houses
                if (validPosition && window.EnvSystem && window.EnvSystem.objects) {
                    validPosition = window.EnvSystem.objects.every(obj => {
                        if (obj.userData.id === 'house_small') {
                            return position.distanceTo(obj.position) >= minDistanceFromHouses;
                        }
                        return true;
                    });
                }

                attempts++;
            }

            if (validPosition && position) {
                // Random tree type for variety
                const treeTypes = ['tree', 'tree_large', 'tree_dead'];
                const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                const tree = window.EnvSystem.spawn(treeType, position);
                if (tree) {
                    spawnedPositions.push(position);
                }
            }
        }

        console.log('[BuildingSystem] Spawned', spawnedPositions.length, 'trees across the map');
    },

    // Find nearest building to player
    getNearbyBuilding: function(playerPos, radius = 5.0) {
        let nearest = null;
        let minDist = radius;

        this.buildingMeshes.forEach((mesh, buildingId) => {
            const dist = playerPos.distanceTo(mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = { mesh, buildingId, distance: dist };
            }
        });

        return nearest;
    },

    // Mark building as discovered
    discoverBuilding: function(buildingId) {
        if (this.discoveredBuildings.has(buildingId)) return;

        this.discoveredBuildings.add(buildingId);

        // Save to gameState
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.buildings) window.gameState.buildings = {};
        if (!window.gameState.buildings.discovered) window.gameState.buildings.discovered = [];

        window.gameState.buildings.discovered = Array.from(this.discoveredBuildings);

        // Show notification
        const building = this.buildings.find(b => b.id === buildingId);
        if (building) {
            this.showDiscoveryNotification(building.name);
            this.updateDiscoveryCounter();
        }

        console.log('[BuildingSystem] Discovered:', buildingId);
    },

    // Enter a building
    enterBuilding: function(buildingId) {
        if (!window.Game || !window.Game.scene) return;
        if (this.currentBuilding) {
            console.warn('[BuildingSystem] Already inside a building');
            return;
        }

        const building = this.buildings.find(b => b.id === buildingId);
        if (!building) {
            console.warn('[BuildingSystem] Building not found:', buildingId);
            return;
        }

        // Save player position
        const player = window.party && window.party[0];
        if (player && player.model) {
            if (!window.gameState.interiorState) window.gameState.interiorState = {};
            window.gameState.interiorState.lastPosition = player.model.position.clone();
        }

        // Hide exterior objects
        if (!window.Game.interiorHiddenObjects) window.Game.interiorHiddenObjects = [];
        window.Game.scene.traverse(obj => {
            if (obj !== window.Game.scene &&
                obj !== player?.model &&
                !obj.userData?.isBuilding &&
                !obj.userData?.isInterior) {
                if (obj.visible) {
                    obj.visible = false;
                    window.Game.interiorHiddenObjects.push(obj);
                }
            }
        });

        // Create building-specific interior
        this.createBuildingInterior(building);

        // Teleport player to interior spawn point
        if (player && player.model) {
            player.model.position.set(0, 0.75, 4.5);
        }

        // Mark as visited
        this.visitedBuildings.add(buildingId);
        if (!window.gameState.buildings) window.gameState.buildings = {};
        if (!window.gameState.buildings.visited) window.gameState.buildings.visited = [];
        window.gameState.buildings.visited = Array.from(this.visitedBuildings);

        this.currentBuilding = buildingId;
        console.log('[BuildingSystem] Entered:', building.name);
    },

    // Exit building
    exitBuilding: function() {
        if (!this.currentBuilding) return;
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
            window.Game.interiorHiddenObjects = [];
        }

        // Restore player position
        const player = window.party && window.party[0];
        if (player && player.model && window.gameState.interiorState && window.gameState.interiorState.lastPosition) {
            player.model.position.copy(window.gameState.interiorState.lastPosition);
        }

        this.currentBuilding = null;
        console.log('[BuildingSystem] Exited building');
    },

    // Create building-specific interior layout
    createBuildingInterior: function(building) {
        if (!window.Game || !window.Game.scene) return;

        const interiorGroup = new THREE.Group();
        interiorGroup.userData.isInterior = true;

        // Base interior (walls, floor, ceiling)
        this.createBaseInterior(interiorGroup);

        // Building-specific elements
        switch (building.type) {
            case 'arena':
                this.createArenaInterior(interiorGroup);
                break;
            case 'shop':
                this.createShopInterior(interiorGroup);
                break;
            case 'forge':
                this.createForgeInterior(interiorGroup);
                break;
            case 'archives':
                this.createArchivesInterior(interiorGroup);
                break;
            case 'house':
                this.createHouseInterior(interiorGroup);
                break;
            case 'photo':
                this.createPhotoInterior(interiorGroup);
                break;
            case 'quest':
                this.createQuestInterior(interiorGroup);
                break;
            case 'mail':
                this.createMailInterior(interiorGroup);
                break;
            case 'apothecary':
                this.createApothecaryInterior(interiorGroup);
                break;
            case 'black_market':
                this.createBlackMarketInterior(interiorGroup);
                break;
            case 'workshop':
                this.createWorkshopInterior(interiorGroup);
                break;
            case 'shrine':
                this.createShrineInterior(interiorGroup);
                break;
            case 'gate':
                this.createGateInterior(interiorGroup);
                break;
            case 'boss':
                this.createBossInterior(interiorGroup);
                break;
            default:
                this.createGenericInterior(interiorGroup);
        }

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
            BuildingSystem.exitBuilding();
        };
        interiorGroup.add(exitPortal);

        window.Game.scene.add(interiorGroup);
        window.Game.currentInterior = interiorGroup;

        // Add exit portal to interactables
        if (!window.Game.interactables) window.Game.interactables = [];
        window.Game.interactables.push(exitPortal);
    },

    // Create base interior (walls, floor, ceiling)
    createBaseInterior: function(group) {
        const size = 10;
        const height = 6;

        // Floor
        const floorGeo = new THREE.PlaneGeometry(size, size);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        group.add(floor);

        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(size, size);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        group.add(ceiling);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
        const walls = [
            { pos: [0, height/2, -size/2], rot: [0, 0, 0] }, // Back
            { pos: [0, height/2, size/2], rot: [0, Math.PI, 0] }, // Front
            { pos: [-size/2, height/2, 0], rot: [0, Math.PI/2, 0] }, // Left
            { pos: [size/2, height/2, 0], rot: [0, -Math.PI/2, 0] }, // Right
        ];

        walls.forEach(wall => {
            const wallGeo = new THREE.PlaneGeometry(size, height);
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.set(...wall.pos);
            wallMesh.rotation.set(...wall.rot);
            wallMesh.receiveShadow = true;
            group.add(wallMesh);
        });
    },

    // Building-specific interior creators
    createArenaInterior: function(group) {
        // Large open space with combat platform
        const platformGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
        const platformMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(0, 0.1, 0);
        platform.receiveShadow = true;
        group.add(platform);
    },

    createShopInterior: function(group) {
        // Counter
        const counterGeo = new THREE.BoxGeometry(4, 1, 1);
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.set(0, 0.5, -2);
        group.add(counter);

        // Shelves
        for (let i = -2; i <= 2; i += 2) {
            const shelfGeo = new THREE.BoxGeometry(1.5, 0.1, 0.8);
            const shelfMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(i, 2, -3);
            group.add(shelf);
        }
    },

    createForgeInterior: function(group) {
        // Anvil
        const anvilGeo = new THREE.BoxGeometry(1, 0.5, 0.8);
        const anvilMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.8 });
        const anvil = new THREE.Mesh(anvilGeo, anvilMat);
        anvil.position.set(-2, 0.25, -2);
        group.add(anvil);

        // Forge (fire pit)
        const forgeGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        const forgeMat = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            emissiveIntensity: 0.5
        });
        const forge = new THREE.Mesh(forgeGeo, forgeMat);
        forge.position.set(2, 0.25, -2);
        group.add(forge);
    },

    createArchivesInterior: function(group) {
        // Bookshelves
        for (let i = -3; i <= 3; i += 2) {
            const shelfGeo = new THREE.BoxGeometry(1, 4, 0.3);
            const shelfMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(i, 2, -3);
            group.add(shelf);
        }
    },

    createHouseInterior: function(group) {
        // Use existing HousingSystem interior style
        // Simple furniture
        const tableGeo = new THREE.BoxGeometry(2, 0.5, 1);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(0, 0.25, -2);
        group.add(table);
    },

    createPhotoInterior: function(group) {
        // Small room with camera stand
        const cameraGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
        const cameraMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 });
        const camera = new THREE.Mesh(cameraGeo, cameraMat);
        camera.position.set(0, 0.75, -2);
        group.add(camera);
    },

    createQuestInterior: function(group) {
        // Quest board
        const boardGeo = new THREE.PlaneGeometry(3, 4);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, 2, -3);
        board.rotation.y = Math.PI;
        group.add(board);
    },

    createMailInterior: function(group) {
        // Post office layout with counters
        for (let i = -1.5; i <= 1.5; i += 1.5) {
            const counterGeo = new THREE.BoxGeometry(1, 1, 0.5);
            const counterMat = new THREE.MeshStandardMaterial({ color: 0x4169e1, roughness: 0.8 });
            const counter = new THREE.Mesh(counterGeo, counterMat);
            counter.position.set(i, 0.5, -2);
            group.add(counter);
        }
    },

    createApothecaryInterior: function(group) {
        // Potion shelves
        for (let i = -3; i <= 3; i += 2) {
            const shelfGeo = new THREE.BoxGeometry(1, 3, 0.3);
            const shelfMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9 });
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(i, 1.5, -3);
            group.add(shelf);
        }
    },

    createBlackMarketInterior: function(group) {
        // Dark underground feel
        const floor = group.children.find(c => c.position.y === 0);
        if (floor) floor.material.color.setHex(0x222222);

        // Dark counter
        const counterGeo = new THREE.BoxGeometry(3, 1, 0.8);
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.set(0, 0.5, -2);
        group.add(counter);
    },

    createWorkshopInterior: function(group) {
        // Workbenches and tools
        const benchGeo = new THREE.BoxGeometry(3, 0.8, 1.5);
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
        const bench = new THREE.Mesh(benchGeo, benchMat);
        bench.position.set(0, 0.4, -2);
        group.add(bench);
    },

    createShrineInterior: function(group) {
        // Altar
        const altarGeo = new THREE.BoxGeometry(2, 1, 1);
        const altarMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7 });
        const altar = new THREE.Mesh(altarGeo, altarMat);
        altar.position.set(0, 0.5, -2);
        group.add(altar);

        // Candles
        for (let i = -0.8; i <= 0.8; i += 0.8) {
            const candleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
            const candleMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffaa00,
                emissiveIntensity: 0.3
            });
            const candle = new THREE.Mesh(candleGeo, candleMat);
            candle.position.set(i, 1.15, -2);
            group.add(candle);
        }
    },

    createGateInterior: function(group) {
        // Gateway/checkpoint
        const gateGeo = new THREE.BoxGeometry(2, 4, 0.3);
        const gateMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
        const gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(0, 2, 0);
        group.add(gate);
    },

    createBossInterior: function(group) {
        // Boss arena (large open space)
        const arenaGeo = new THREE.CylinderGeometry(6, 6, 0.2, 32);
        const arenaMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
        const arena = new THREE.Mesh(arenaGeo, arenaMat);
        arena.position.set(0, 0.1, 0);
        arena.receiveShadow = true;
        group.add(arena);
    },

    createGenericInterior: function(group) {
        // Default interior (already has base)
    },

    // Update discovery check (called from game loop)
    updateDiscovery: function() {
        const now = Date.now();
        if (now - this.lastDiscoveryCheck < this.discoveryCheckInterval) return;
        this.lastDiscoveryCheck = now;

        const player = window.party && window.party[0];
        if (!player || !player.model) return;

        const nearby = this.getNearbyBuilding(player.model.position, 8.0);
        if (nearby) {
            this.discoverBuilding(nearby.buildingId);
        }

        // Update entry prompt
        this.updateEntryPrompt(player.model.position);
    },

    // Update entry prompt UI
    updateEntryPrompt: function(playerPos) {
        if (!this.entryPromptElement) return;

        const nearby = this.getNearbyBuilding(playerPos, 5.0);
        if (nearby) {
            const building = this.buildings.find(b => b.id === nearby.buildingId);
            if (building) {
                this.entryPromptElement.textContent = `Press E to Enter ${building.name}`;
                this.entryPromptElement.style.display = 'block';
                return;
            }
        }

        this.entryPromptElement.style.display = 'none';
    },

    // Create UI elements
    createUIElements: function() {
        // Building discovery counter
        const counterDiv = document.createElement('div');
        counterDiv.id = 'building-discovery-counter';
        counterDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
        `;
        this.discoveryCounterElement = counterDiv;
        document.body.appendChild(counterDiv);
        this.updateDiscoveryCounter();

        // Entry prompt
        const promptDiv = document.createElement('div');
        promptDiv.id = 'building-entry-prompt';
        promptDiv.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            z-index: 1000;
            display: none;
            pointer-events: none;
        `;
        this.entryPromptElement = promptDiv;
        document.body.appendChild(promptDiv);
    },

    // Update discovery counter
    updateDiscoveryCounter: function() {
        if (!this.discoveryCounterElement) return;
        const count = this.discoveredBuildings.size;
        this.discoveryCounterElement.textContent = `Buildings: ${count} / 14`;
    },

    // Show discovery notification
    showDiscoveryNotification: function(buildingName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 150, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 1001;
            pointer-events: none;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = `Discovered: ${buildingName}!`;

        // Add animation if not already added
        if (!document.getElementById('building-notification-style')) {
            const style = document.createElement('style');
            style.id = 'building-notification-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
};

// Export to window
window.BuildingSystem = BuildingSystem;
