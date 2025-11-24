// Game World System - City Generation, Environment, and World Management
// This module handles procedural city generation, environment destruction, and world creation

// CityGenerator - Procedural city grid generation
const CityGenerator = {
    gridSize: 10, // 10x10 grid
    cellSize: 20, // Each cell is 20 units
    grid: [], // 2D array: 'road' or building type

    init: () => {
        console.log('[CityGenerator] Initializing city grid...');
        CityGenerator.generateGrid();
        CityGenerator.spawnBuildings();
        CityGenerator.createRoadMesh();
        console.log('[CityGenerator] City generated:', CityGenerator.grid.length, 'x', CityGenerator.grid[0]?.length || 0);
    },

    generateGrid: () => {
        CityGenerator.grid = [];

        // Initialize 10x10 grid
        for (let z = 0; z < CityGenerator.gridSize; z++) {
            CityGenerator.grid[z] = [];
            for (let x = 0; x < CityGenerator.gridSize; x++) {
                const rand = Math.random();

                // 10% chance: skyscraper
                if (rand < 0.1) {
                    CityGenerator.grid[z][x] = 'skyscraper';
                }
                // 15% chance: house_small
                else if (rand < 0.25) {
                    CityGenerator.grid[z][x] = 'house_small';
                }
                // 5% chance: bank
                else if (rand < 0.3) {
                    CityGenerator.grid[z][x] = 'bank';
                }
                // Remaining: road/empty
                else {
                    CityGenerator.grid[z][x] = 'road';
                }
            }
        }

        // Store grid data
        if (window.Game) {
            window.Game.cityGrid = CityGenerator.grid;
        }
    },

    getWorldPosition: (gridX, gridZ) => {
        const totalSize = CityGenerator.gridSize * CityGenerator.cellSize;
        const offset = -(totalSize / 2) + (CityGenerator.cellSize / 2);
        return {
            x: offset + (gridX * CityGenerator.cellSize),
            z: offset + (gridZ * CityGenerator.cellSize)
        };
    },

    spawnBuildings: () => {
        if (!window.Game || !window.Game.scene || !window.EnvSystem) {
            console.warn('[CityGenerator] Game.scene or EnvSystem not ready');
            return;
        }

        for (let z = 0; z < CityGenerator.gridSize; z++) {
            for (let x = 0; x < CityGenerator.gridSize; x++) {
                const cellType = CityGenerator.grid[z][x];

                // Skip roads
                if (cellType === 'road') continue;

                // Spawn building
                const worldPos = CityGenerator.getWorldPosition(x, z);
                const position = new THREE.Vector3(worldPos.x, 0, worldPos.z);

                // Use EnvSystem to spawn
                window.EnvSystem.spawn(cellType, position);
            }
        }

        console.log(`[CityGenerator] Spawned buildings from grid`);
    },

    createRoadMesh: () => {
        if (!window.Game || !window.Game.scene) return;

        const totalSize = CityGenerator.gridSize * CityGenerator.cellSize;
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x444455,
            roughness: 0.9,
            metalness: 0.1
        });

        // Create road floor covering entire grid
        const roadGeo = new THREE.PlaneGeometry(totalSize, totalSize);
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01; // Slightly above ground
        road.receiveShadow = true;
        window.Game.scene.add(road);

        // Add road markings (optional - yellow lines)
        for (let i = 0; i < CityGenerator.gridSize; i++) {
            // Horizontal lines
            if (i % 2 === 0) {
                const lineGeo = new THREE.PlaneGeometry(totalSize, 0.2);
                const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.3 });
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.rotation.x = -Math.PI / 2;
                line.position.set(0, 0.02, -(totalSize/2) + (i * CityGenerator.cellSize));
                window.Game.scene.add(line);
            }
            // Vertical lines
            if (i % 2 === 0) {
                const lineGeo = new THREE.PlaneGeometry(0.2, totalSize);
                const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.3 });
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.rotation.x = -Math.PI / 2;
                line.position.set(-(totalSize/2) + (i * CityGenerator.cellSize), 0.02, 0);
                window.Game.scene.add(line);
            }
        }

        console.log('[CityGenerator] Road mesh created');
    },

    getRandomRoadPosition: () => {
        const roads = [];
        for (let z = 0; z < CityGenerator.gridSize; z++) {
            for (let x = 0; x < CityGenerator.gridSize; x++) {
                if (CityGenerator.grid[z][x] === 'road') {
                    roads.push({ x, z });
                }
            }
        }
        if (roads.length === 0) return { x: 0, z: 0 };
        const road = roads[Math.floor(Math.random() * roads.length)];
        return CityGenerator.getWorldPosition(road.x, road.z);
    }
};

// CityIntegritySystem - City health and mission failure
const CityIntegritySystem = {
    integrity: 100, // 0-100%
    maxIntegrity: 100,

    init: () => {
        CityIntegritySystem.integrity = 100;
        CityIntegritySystem.createUI();
        console.log('[CityIntegritySystem] Initialized');
    },

    createUI: () => {
        // UI is created in HTML, just update it
        CityIntegritySystem.updateUI();
    },

    updateUI: () => {
        const bar = document.getElementById('integrity-bar');
        const text = document.getElementById('integrity-text');

        if (bar && text) {
            const pct = Math.max(0, Math.min(100, CityIntegritySystem.integrity));
            bar.style.width = pct + '%';
            text.textContent = Math.round(pct) + '%';

            // Color states
            bar.classList.remove('yellow', 'red');
            if (pct < 30) {
                bar.classList.add('red');
            } else if (pct < 60) {
                bar.classList.add('yellow');
            }
        }
    },

    damage: (amount) => {
        CityIntegritySystem.integrity = Math.max(0, CityIntegritySystem.integrity - amount);
        CityIntegritySystem.updateUI();

        if (CityIntegritySystem.integrity <= 0) {
            CityIntegritySystem.onMissionFailed();
        }
    },

    onMissionFailed: () => {
        const overlay = document.getElementById('mission-failed');
        if (overlay) {
            overlay.classList.add('show');
            if (typeof window.screenShake === 'function') {
                window.screenShake(2.0);
            }
        }
    }
};

function updateCityIntegrity(amount) {
    if (CityIntegritySystem && typeof CityIntegritySystem.damage === 'function') {
        CityIntegritySystem.damage(amount);
    }
}

// Helper that builds multi-part structures (doors/windows) for buildings
function createBuildingWithDetails(type, def) {
    const group = new THREE.Group();

    // Base structure
    const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.8 });
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x, def.scale.y, def.scale.z),
        bodyMat
    );
    body.position.y = 0;
    group.add(body);

    // Door setup
    const doorWidth = Math.min(def.scale.x * 0.4, 2);
    const doorHeight = Math.min(def.scale.y * 0.35, 3.5);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.4 });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, 0.2),
        doorMat
    );
    door.position.set(0, -(def.scale.y / 2) + doorHeight / 2, (def.scale.z / 2) + 0.05);
    group.add(door);

    // Door frame gives readability
    const frameThickness = 0.1;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, metalness: 0.2 });
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth + frameThickness, doorHeight + frameThickness, 0.25),
        frameMat
    );
    frame.position.copy(door.position);
    group.add(frame);

    // Window generation (random count per face)
    const windowMatLit = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        emissive: 0x87ceeb,
        emissiveIntensity: 0.6,
        roughness: 0.2
    });
    const windowMatDark = new THREE.MeshStandardMaterial({
        color: 0x5a7d8a,
        emissive: 0x000000,
        roughness: 0.4
    });

    const windowsPerFace = type === 'skyscraper' ? 10 + Math.floor(Math.random() * 8) :
                            type === 'bank' ? 8 + Math.floor(Math.random() * 4) :
                            4 + Math.floor(Math.random() * 3);

    const windowWidth = Math.min(1, def.scale.x * 0.2);
    const windowHeight = Math.min(1.5, def.scale.y * 0.15);
    const windowDepthOffset = (def.scale.z / 2) + 0.05;

    function addWindow(position, lit) {
        const mat = lit ? windowMatLit : windowMatDark;
        const pane = new THREE.Mesh(
            new THREE.BoxGeometry(windowWidth, windowHeight, 0.1),
            mat
        );
        pane.position.copy(position);
        group.add(pane);

        // Simple frame for contrast
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(windowWidth + 0.1, windowHeight + 0.1, 0.15),
            frameMat
        );
        frame.position.copy(position);
        group.add(frame);
    }

    for (let i = 0; i < windowsPerFace; i++) {
        const face = i % 4;
        const heightSegments = Math.max(2, Math.floor(def.scale.y / 2));
        const row = Math.floor(Math.random() * heightSegments);
        const col = Math.random() * 0.8 - 0.4;
        const verticalOffset = -(def.scale.y / 2) + (row / heightSegments * def.scale.y) + windowHeight * 0.8;
        const horizontalOffset = col * def.scale.x;
        const lit = Math.random() < 0.35;

        if (face === 0) {
            addWindow(new THREE.Vector3(horizontalOffset, verticalOffset, windowDepthOffset), lit);
        } else if (face === 1) {
            addWindow(new THREE.Vector3(horizontalOffset, verticalOffset, -windowDepthOffset), lit);
        } else if (face === 2) {
            addWindow(new THREE.Vector3((def.scale.x / 2) + 0.05, verticalOffset, horizontalOffset), lit);
        } else {
            addWindow(new THREE.Vector3(-(def.scale.x / 2) - 0.05, verticalOffset, horizontalOffset), lit);
        }
    }

    // Roof accent for variety
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.4 });
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x * 1.05, def.scale.y * 0.05, def.scale.z * 1.05),
        roofMat
    );
    roof.position.y = def.scale.y / 2;
    group.add(roof);

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    return group;
}

function createTrashcanMesh(def) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(def.scale.x * 0.4, def.scale.x * 0.5, def.scale.y, 16),
        new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.6, roughness: 0.2 })
    );
    body.position.y = 0;
    group.add(body);

    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(def.scale.x * 0.55, def.scale.x * 0.6, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.15 })
    );
    rim.position.y = def.scale.y / 2;
    group.add(rim);

    const lid = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x * 0.9, 0.15, def.scale.x * 0.9),
        new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.7 })
    );
    lid.position.y = def.scale.y / 2 + 0.15;
    group.add(lid);

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    return group;
}

function createBrokenVehicleMesh(def) {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.2, roughness: 0.7 });
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x, def.scale.y * 0.6, def.scale.z),
        baseMat
    );
    base.position.y = -(def.scale.y * 0.2);
    base.rotation.y = (Math.random() - 0.5) * 0.6;
    group.add(base);

    // Cabin
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x * 0.5, def.scale.y * 0.7, def.scale.z * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 })
    );
    cabin.position.set(0, def.scale.y * 0.1, -def.scale.z * 0.15);
    group.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(def.scale.y * 0.3, def.scale.y * 0.3, def.scale.x * 0.1, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelOffsets = [
        { x: def.scale.x * 0.35, z: def.scale.z * 0.4 },
        { x: -def.scale.x * 0.35, z: def.scale.z * 0.4 },
        { x: def.scale.x * 0.35, z: -def.scale.z * 0.4 },
        { x: -def.scale.x * 0.35, z: -def.scale.z * 0.4 }
    ];
    wheelOffsets.forEach(({ x, z }) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -(def.scale.y * 0.35), z);
        wheel.rotation.y = Math.random() * 0.5;
        group.add(wheel);
    });

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    return group;
}

function createRockMesh(def) {
    const geometry = Math.random() > 0.5
        ? new THREE.DodecahedronGeometry(Math.max(def.scale.x, def.scale.z) * 0.4)
        : new THREE.OctahedronGeometry(Math.max(def.scale.x, def.scale.z) * 0.5);
    const rock = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.9 })
    );
    rock.scale.set(def.scale.x, def.scale.y, def.scale.z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
}

function createTreeMesh(def, options = {}) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(def.scale.x * 0.2, def.scale.x * 0.3, def.scale.y, 12),
        new THREE.MeshStandardMaterial({ color: options.trunkColor || 0x8b5a2b })
    );
    trunk.position.y = 0;
    group.add(trunk);

    if (options.dead) {
        // Sparse branches for dead tree
        for (let i = 0; i < 3; i++) {
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, def.scale.x * 1.5, 6),
                new THREE.MeshStandardMaterial({ color: 0x4a2c14 })
            );
            branch.position.y = -def.scale.y / 4 + i * (def.scale.y / 3);
            branch.rotation.z = (Math.random() - 0.5) * 1.5;
            branch.rotation.x = (Math.random() - 0.5) * 1.5;
            group.add(branch);
        }
    } else {
        const foliageMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6 });
        const foliageCount = options.large ? 3 : 1;
        for (let i = 0; i < foliageCount; i++) {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(def.scale.x * (options.large ? 0.9 : 0.7), 12, 12),
                foliageMat
            );
            const verticalOffset = (def.scale.y / 2) - (i * def.scale.y * 0.15);
            sphere.position.set(0, verticalOffset, 0);
            group.add(sphere);
        }
    }

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    return group;
}

// EnvSystem - Environment object spawning and destruction
const EnvSystem = {
    objects: [],

    spawn: (type, position) => {
        if (!window.Game || !window.Game.scene) return null;

        const defs = {
            tree: { hp: 50, scale: {x:1, y:3, z:1}, color: 0x228b22, drop: {min: 50, max: 150} },
            rock: { hp: 100, scale: {x:2, y:1.5, z:2}, color: 0x555555, drop: {min: 100, max: 300} },
            building: { hp: 500, scale: {x:5, y:8, z:5}, color: 0x333344, drop: {min: 1000, max: 5000} },
            house_small: { hp: 500, scale: {x:4, y:3, z:4}, color: 0x88aabb, drop: {min: 500, max: 1500} },
            skyscraper: { hp: 5000, scale: {x:10, y:30, z:10}, color: 0x223344, drop: {min: 5000, max: 15000} },
            bank: { hp: 2000, scale: {x:8, y:6, z:12}, color: 0x445566, drop: {min: 2000, max: 8000} },
            trashcan: { hp: 30, scale: {x:1, y:1.2, z:1}, color: 0x3a3a3a, drop: {min: 20, max: 80} },
            broken_vehicle: { hp: 200, scale: {x:3, y:1.5, z:5}, color: 0x444444, drop: {min: 150, max: 400} },
            rock_large: { hp: 150, scale: {x:3, y:2, z:3}, color: 0x666666, drop: {min: 120, max: 250} },
            rock_small: { hp: 50, scale: {x:1.2, y:0.8, z:1.2}, color: 0x555555, drop: {min: 40, max: 100} },
            tree_large: { hp: 80, scale: {x:1.5, y:5, z:1.5}, color: 0x1f8a2c, drop: {min: 60, max: 180} },
            tree_dead: { hp: 40, scale: {x:1, y:2.5, z:1}, color: 0x6a3a1c, drop: {min: 30, max: 90} }
        };

        const def = defs[type] || defs.tree;

        const buildingTypes = new Set(['building', 'house_small', 'skyscraper', 'bank']);
        const customFactories = {
            trashcan: createTrashcanMesh,
            broken_vehicle: createBrokenVehicleMesh,
            rock_large: createRockMesh,
            rock_small: createRockMesh,
            tree_large: (def) => createTreeMesh(def, { large: true }),
            tree_dead: (def) => createTreeMesh(def, { dead: true, trunkColor: 0x5c3520 })
        };

        let mesh;
        if (buildingTypes.has(type)) {
            mesh = createBuildingWithDetails(type, def);
        } else if (customFactories[type]) {
            mesh = customFactories[type](def);
        } else {
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(def.scale.x, def.scale.y, def.scale.z),
                new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.8 })
            );
        }
        mesh.position.copy(position);
        mesh.position.y = def.scale.y / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Store data in userData
        mesh.userData = {
            id: type,
            hp: def.hp,
            hpMax: def.hp,
            scale: def.scale,
            drop: def.drop,
            isDestructible: true
        };

        window.Game.scene.add(mesh);
        EnvSystem.objects.push(mesh);

        return mesh;
    },

    damage: (mesh, amount) => {
        if (!mesh.userData || !mesh.userData.isDestructible) return false;

        mesh.userData.hp -= amount;

        // Visual feedback - flash red
        if (mesh.material) {
            const originalColor = mesh.material.color.clone();
            mesh.material.color.setHex(0xff0000);
            setTimeout(() => {
                if (mesh.material) mesh.material.color.copy(originalColor);
            }, 100);
        }

        if (mesh.userData.hp <= 0) {
            EnvSystem.destroy(mesh);
            return true;
        }

        return false;
    },

    destroy: (mesh) => {
        if (!mesh.userData) return;

        const pos = mesh.position.clone();
        const drop = mesh.userData.drop;

        // Spawn loot
        if (drop && typeof window.spawnLoot === 'function') {
            const goldAmount = Math.floor(Math.random() * (drop.max - drop.min) + drop.min);
            window.spawnLoot(pos, 'gold', goldAmount);
        }

        // Destruction VFX
        if (typeof window.createExplosion === 'function') {
            window.createExplosion(pos, 0xff8800);
        }

        // Screen shake based on object size
        const objSize = Math.max(mesh.userData.scale.x, mesh.userData.scale.y, mesh.userData.scale.z);
        if (typeof window.screenShake === 'function') {
            window.screenShake(0.2 * (objSize / 10));
        }

        // Remove from scene and array
        if (window.Game && window.Game.scene) {
            window.Game.scene.remove(mesh);
        }
        const index = EnvSystem.objects.indexOf(mesh);
        if (index > -1) {
            EnvSystem.objects.splice(index, 1);
        }

        // Update city integrity if it's a building
        if (mesh.userData.id === 'building' || mesh.userData.id === 'house_small' || mesh.userData.id === 'skyscraper' || mesh.userData.id === 'bank') {
            if (typeof updateCityIntegrity === 'function') {
                updateCityIntegrity(-(mesh.userData.hpMax / 100));
            }
        }
    },

    update: (dt) => {
        // Environment system update (can add animations, etc.)
    }
};

function spawnRandomBreakables(count = 25) {
    if (!window.EnvSystem || !window.Game || !window.Game.scene) return;

    const spawnTypes = [
        'trashcan',
        'broken_vehicle',
        'rock_large',
        'rock_small',
        'tree_large',
        'tree_dead',
        'tree',
        'rock'
    ];

    function getSpawnPosition() {
        if (typeof CityGenerator !== 'undefined' && CityGenerator.getRandomRoadPosition) {
            const pos2D = CityGenerator.getRandomRoadPosition();
            return new THREE.Vector3(pos2D.x + (Math.random() - 0.5) * 5, 0, pos2D.z + (Math.random() - 0.5) * 5);
        }
        return new THREE.Vector3(
            (Math.random() - 0.5) * 200,
            0,
            (Math.random() - 0.5) * 200
        );
    }

    for (let i = 0; i < count; i++) {
        const type = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
        const position = getSpawnPosition();
        position.y = 0;
        window.EnvSystem.spawn(type, position);
    }
}

window.spawnRandomBreakables = spawnRandomBreakables;

function createPlatformMesh(def) {
    const material = new THREE.MeshStandardMaterial({
        color: def.color,
        metalness: 0.4,
        roughness: 0.4,
        emissive: def.emissive || 0x000000,
        emissiveIntensity: def.emissiveIntensity || 0.2
    });
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(def.scale.x, def.scale.y, def.scale.z),
        material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.bounds = {
        halfX: def.scale.x / 2,
        halfZ: def.scale.z / 2,
        halfY: def.scale.y / 2
    };
    return mesh;
}

const PlatformSystem = {
    platforms: [],

    spawn: (type = 'floating_platform', position = new THREE.Vector3(), overrides = {}) => {
        if (!window.Game || !window.Game.scene) return null;

        const defs = {
            floating_strip: {
                scale: { x: 12, y: 0.6, z: 3 },
                color: 0x8f8f8f,
                emissive: 0x444444,
                emissiveIntensity: 0.4,
                elevation: [3, 8]
            },
            floating_platform: {
                scale: { x: 4, y: 0.6, z: 4 },
                color: 0x7a7a7a,
                emissive: 0x333333,
                emissiveIntensity: 0.3,
                elevation: [4, 10]
            },
            moving_platform: {
                scale: { x: 5, y: 0.6, z: 2.5 },
                color: 0x999999,
                emissive: 0x555555,
                emissiveIntensity: 0.5,
                elevation: [5, 9],
                movement: { axis: 'x', amplitude: 6, speed: 1.5 }
            }
        };

        const def = Object.assign({}, defs[type] || defs.floating_platform);
        if (overrides.scale) def.scale = overrides.scale;
        if (overrides.color) def.color = overrides.color;
        if (overrides.emissive) def.emissive = overrides.emissive;
        if (overrides.emissiveIntensity) def.emissiveIntensity = overrides.emissiveIntensity;

        const mesh = createPlatformMesh(def);
        const heightRange = overrides.elevation || def.elevation || [3, 8];
        const height = overrides.height !== undefined ? overrides.height :
            heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]);
        mesh.position.copy(position);
        mesh.position.y = height;

        mesh.userData.platformType = type;
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.lastDelta = new THREE.Vector3();

        if (def.movement || overrides.movement) {
            const movement = Object.assign({}, def.movement, overrides.movement);
            movement.time = Math.random() * Math.PI * 2;
            mesh.userData.movement = movement;
        }

        window.Game.scene.add(mesh);
        PlatformSystem.platforms.push(mesh);
        return mesh;
    },

    spawnRandomPlatforms: (count = 8) => {
        if (!window.Game || !window.Game.scene) return;

        const types = ['floating_strip', 'floating_platform', 'moving_platform'];
        const getPosition = () => {
            if (typeof CityGenerator !== 'undefined' && CityGenerator.getRandomRoadPosition) {
                const base = CityGenerator.getRandomRoadPosition();
                return new THREE.Vector3(base.x + (Math.random() - 0.5) * 10, 0, base.z + (Math.random() - 0.5) * 10);
            }
            return new THREE.Vector3(
                (Math.random() - 0.5) * 180,
                0,
                (Math.random() - 0.5) * 180
            );
        };

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            PlatformSystem.spawn(type, getPosition());
        }
    },

    getSurfaceData: (position, tolerance = 0.6) => {
        for (const platform of PlatformSystem.platforms) {
            if (!platform || !platform.userData || !platform.userData.bounds) continue;
            const bounds = platform.userData.bounds;
            const dx = Math.abs(position.x - platform.position.x);
            const dz = Math.abs(position.z - platform.position.z);
            if (dx <= bounds.halfX + tolerance && dz <= bounds.halfZ + tolerance) {
                const topHeight = platform.position.y + bounds.halfY;
                const distanceY = position.y - topHeight;
                if (distanceY <= 2 && distanceY >= -1) {
                    return { height: topHeight, platform };
                }
            }
        }
        return null;
    },

    update: (dt) => {
        PlatformSystem.platforms.forEach(platform => {
            if (!platform.userData) return;
            const previous = platform.position.clone();
            if (platform.userData.movement) {
                const move = platform.userData.movement;
                move.time += dt * (move.speed || 1);
                const offset = Math.sin(move.time) * (move.amplitude || 4);
                const axis = move.axis || 'x';
                platform.position.copy(platform.userData.basePosition);
                platform.position[axis] = platform.userData.basePosition[axis] + offset;
            }
            platform.userData.lastDelta = platform.position.clone().sub(previous);
        });
    }
};

window.PlatformSystem = PlatformSystem;

const TreeHouseSystem = {
    treeHouses: [],
    lanterns: [],

    spawn: (position = new THREE.Vector3()) => {
        if (!window.Game || !window.Game.scene) return null;

        const group = new THREE.Group();
        const baseHeight = 6 + Math.random() * 3;
        const def = {
            scale: { x: 2, y: baseHeight, z: 2 },
            color: 0x1f8a2c
        };
        const tree = createTreeMesh(def, { large: true });
        tree.position.y = baseHeight / 2;
        group.add(tree);

        // Ladder up the front
        const ladderMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.5 });
        const rungCount = Math.floor(baseHeight / 0.8);
        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.1, 0.1),
                ladderMat
            );
            rung.position.set(0, 0.5 + i * 0.6, def.scale.z / 2 + 0.2);
            group.add(rung);
        }

        const supportLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, baseHeight * 0.9, 0.15),
            ladderMat
        );
        supportLeft.position.set(-0.6, baseHeight * 0.45, def.scale.z / 2 + 0.2);
        group.add(supportLeft);

        const supportRight = supportLeft.clone();
        supportRight.position.x = 0.6;
        group.add(supportRight);

        // Platform on top
        const platformHeight = baseHeight + 0.4;
        const platform = createPlatformMesh({
            scale: { x: 4, y: 0.4, z: 4 },
            color: 0x8b6f4e,
            emissive: 0x3a2a15,
            emissiveIntensity: 0.2
        });
        platform.position.y = platformHeight;
        platform.userData.platformType = 'tree_house_platform';
        platform.userData.basePosition = platform.position.clone();
        platform.userData.lastDelta = new THREE.Vector3();
        group.add(platform);
        PlatformSystem.platforms.push(platform);

        // Simple hut on platform
        const hutWidth = 2.5;
        const hutDepth = 2;
        const hutHeight = 1.8;
        const hutMat = new THREE.MeshStandardMaterial({ color: 0xa05a2c, roughness: 0.6 });
        const hut = new THREE.Mesh(
            new THREE.BoxGeometry(hutWidth, hutHeight, hutDepth),
            hutMat
        );
        hut.position.set(0, platformHeight + hutHeight / 2, -0.5);
        group.add(hut);

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(hutWidth * 0.8, 1.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x5c2a10, roughness: 0.5 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.set(0, platformHeight + hutHeight + 0.6, -0.5);
        group.add(roof);

        const lanternMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd966,
            emissive: 0xffcc33,
            emissiveIntensity: 0.8
        });
        const lantern = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            lanternMaterial
        );
        lantern.position.set(1.5, platformHeight - 0.2, 0);
        lantern.userData.flicker = {
            baseIntensity: lanternMaterial.emissiveIntensity,
            variance: 0.35 + Math.random() * 0.2,
            speed: 2 + Math.random() * 2,
            phase: Math.random() * Math.PI * 2
        };
        group.add(lantern);
        TreeHouseSystem.lanterns.push(lantern);

        group.position.copy(position);
        window.Game.scene.add(group);
        TreeHouseSystem.treeHouses.push(group);
        return group;
    },

    spawnTreeHouses: (count = 4) => {
        if (!window.Game || !window.Game.scene) return;

        const getSpawnPosition = () => {
            if (typeof CityGenerator !== 'undefined' && CityGenerator.grid) {
                const validCells = [];
                for (let z = 0; z < CityGenerator.grid.length; z++) {
                    for (let x = 0; x < CityGenerator.grid[z].length; x++) {
                        if (CityGenerator.grid[z][x] !== 'road') {
                            validCells.push({ x, z });
                        }
                    }
                }
                if (validCells.length) {
                    const cell = validCells[Math.floor(Math.random() * validCells.length)];
                    const worldPos = CityGenerator.getWorldPosition(cell.x, cell.z);
                    return new THREE.Vector3(worldPos.x, 0, worldPos.z);
                }
            }
            return new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                0,
                (Math.random() - 0.5) * 200
            );
        };

        for (let i = 0; i < count; i++) {
            TreeHouseSystem.spawn(getSpawnPosition());
        }
    },

    update: (dt) => {
        if (!TreeHouseSystem.lanterns.length) return;
        TreeHouseSystem.lanterns = TreeHouseSystem.lanterns.filter(l => l && l.parent);
        TreeHouseSystem.lanterns.forEach(lantern => {
            if (!lantern.material || !lantern.userData.flicker) return;
            const flicker = lantern.userData.flicker;
            flicker.phase += dt * flicker.speed;
            const intensity = flicker.baseIntensity + Math.sin(flicker.phase) * flicker.variance;
            lantern.material.emissiveIntensity = Math.max(0.1, intensity);
        });
    }
};

window.TreeHouseSystem = TreeHouseSystem;

function createChestMesh() {
    const group = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.7, roughness: 0.3 });
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.2, 1.4),
        baseMat
    );
    base.position.y = 0.6;
    group.add(base);

    const bandMat = new THREE.MeshStandardMaterial({ color: 0x2c1b0c, metalness: 0.4 });
    const band = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.2, 1.45),
        bandMat
    );
    band.position.y = 0.9;
    group.add(band);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 1.2, 0);
    const lid = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.6, 1.4),
        baseMat.clone()
    );
    lid.position.y = 0.3;
    lidPivot.add(lid);
    group.add(lidPivot);

    const glow = new THREE.PointLight(0xffd966, 0.5, 6);
    glow.position.set(0, 1.5, 0);
    group.add(glow);

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    group.userData.lidPivot = lidPivot;
    group.userData.lidAngle = 0;
    group.userData.targetAngle = 0;
    group.userData.openSpeed = 2.5;
    group.userData.baseMaterial = base.material;
    group.userData.lidMaterial = lid.material;
    group.userData.bandMaterial = band.material;
    group.userData.glow = glow;
    return group;
}

let chestIdCounter = 0;
let chestMarkerTexture = null;

function getChestMarkerTexture() {
    if (chestMarkerTexture) return chestMarkerTexture;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ff0066';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', size / 2, size / 2);
    chestMarkerTexture = new THREE.CanvasTexture(canvas);
    chestMarkerTexture.needsUpdate = true;
    return chestMarkerTexture;
}

const ChestSystem = {
    chests: [],

    spawn: (position = new THREE.Vector3(), options = {}) => {
        if (!window.Game || !window.Game.scene) return null;

        const chest = createChestMesh();
        chest.position.copy(position);
        chest.userData.type = 'chest';
        chest.userData.id = `chest_${++chestIdCounter}`;
        chest.userData.state = 'locked';
        chest.userData.guards = [];
        chest.userData.opened = false;
        chest.userData.drop = options.drop || { gold: [300, 800], rareChance: 0.4 };
        chest.userData.tooltip = 'Guarded Treasure Chest';

        if (!window.Game.interactables) window.Game.interactables = [];
        window.Game.interactables.push(chest);

        window.Game.scene.add(chest);
        ChestSystem.chests.push(chest);

        const markerTexture = getChestMarkerTexture();
        const markerMaterial = new THREE.SpriteMaterial({
            map: markerTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            opacity: 0.85
        });
        const marker = new THREE.Sprite(markerMaterial);
        marker.scale.set(2.5, 2.5, 2.5);
        marker.position.set(0, 6, 0);
        chest.add(marker);
        chest.userData.marker = marker;

        const guardCount = options.guardCount || (2 + Math.floor(Math.random() * 3));
        const guardRadius = 5;
        const guardOffsets = [];

        for (let i = 0; i < guardCount; i++) {
            const angle = (i / guardCount) * Math.PI * 2;
            const offset = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(guardRadius);
            guardOffsets.push(offset);
        }

        guardOffsets.forEach(offset => {
            if (window.Enemy) {
                const guard = new window.Enemy(position.clone().add(offset));
                guard.aggroRange = 25;
                guard.attackRange = 3;
                guard.isChestGuard = true;
                guard.guardCenter = position.clone();
                guard.guardChestId = chest.userData.id;
                guard.speed = 6;
                guard.damage = 15;
                guard.maxHealth = 180;
                guard.health = 180;
                window.enemies.push(guard);
                chest.userData.guards.push(guard);
            }
        });

        return chest;
    },

    areGuardsCleared: (chest) => {
        if (!chest.userData.guards.length) return true;
        return chest.userData.guards.every(guard => !guard || guard.isDead);
    },

    unlockChest: (chest) => {
        if (chest.userData.state !== 'locked') return;
        chest.userData.state = 'unlocked';
        if (chest.userData.baseMaterial) {
            chest.userData.baseMaterial.color.setHex(0x00a86b);
        }
        if (chest.userData.lidMaterial) {
            chest.userData.lidMaterial.color.setHex(0x00c98b);
        }
        if (chest.userData.glow) {
            chest.userData.glow.color.setHex(0x00ff88);
        }
        if (typeof window.createFloater === 'function') {
            const player = window.party && window.party[0];
            if (player) {
                window.createFloater("CHEST UNLOCKED", chest.position.clone(), "#00ff88");
            }
        }
    },

    openChest: (chest) => {
        if (!chest || chest.userData.state !== 'unlocked') return;
        chest.userData.state = 'opened';
        chest.userData.targetAngle = -Math.PI / 1.7;
        if (chest.userData.marker) {
            chest.userData.marker.material.opacity = 0.0;
            chest.remove(chest.userData.marker);
            chest.userData.marker = null;
        }

        const drop = chest.userData.drop;
        const goldRange = drop.gold || [200, 500];
        const goldValue = Math.floor(Math.random() * (goldRange[1] - goldRange[0]) + goldRange[0]);
        if (typeof window.spawnLoot === 'function') {
            for (let i = 0; i < 3; i++) {
                const offset = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
                window.spawnLoot(chest.position.clone().add(offset), 'gold', Math.floor(goldValue / 3));
            }
        }

        if (window.A1K_ITEMS_DB && Math.random() < (drop.rareChance || 0.3)) {
            const itemKeys = Object.keys(window.A1K_ITEMS_DB);
            if (itemKeys.length) {
                const itemId = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                window.spawnLoot(chest.position.clone().add(new THREE.Vector3(0, 0, 0)), 'item', itemId);
            }
        }

        if (window.createFloater) {
            window.createFloater("LOOT +", chest.position.clone(), "#ffd966");
        }
    },

    handleInteraction: (chest) => {
        if (!chest || !chest.userData) return;
        if (chest.userData.state === 'locked') {
            if (window.createFloater) {
                window.createFloater("Defeat guards first!", chest.position.clone(), "#ff5555");
            }
            return;
        }
        if (chest.userData.state === 'opened') {
            if (window.createFloater) {
                window.createFloater("Already opened", chest.position.clone(), "#cccccc");
            }
            return;
        }

        ChestSystem.openChest(chest);
    },

    spawnGuardedChests: (count = 6) => {
        const getPosition = () => {
            if (typeof CityGenerator !== 'undefined' && CityGenerator.grid) {
                const cells = [];
                for (let z = 0; z < CityGenerator.grid.length; z++) {
                    for (let x = 0; x < CityGenerator.grid[z].length; x++) {
                        if (CityGenerator.grid[z][x] !== 'road') {
                            const worldPos = CityGenerator.getWorldPosition(x, z);
                            cells.push(new THREE.Vector3(worldPos.x, 0, worldPos.z));
                        }
                    }
                }
                if (cells.length) {
                    return cells[Math.floor(Math.random() * cells.length)];
                }
            }
            return new THREE.Vector3(
                (Math.random() - 0.5) * 180,
                0,
                (Math.random() - 0.5) * 180
            );
        };

        for (let i = 0; i < count; i++) {
            ChestSystem.spawn(getPosition());
        }
    },

    update: (dt) => {
        ChestSystem.chests.forEach(chest => {
            if (!chest || !chest.userData) return;
            if (chest.userData.state === 'locked' && ChestSystem.areGuardsCleared(chest)) {
                ChestSystem.unlockChest(chest);
            }

            const lidPivot = chest.userData.lidPivot;
            if (lidPivot) {
                const current = chest.userData.lidAngle;
                const target = chest.userData.targetAngle;
                const delta = (target - current) * Math.min(1, dt * chest.userData.openSpeed);
                chest.userData.lidAngle += delta;
                lidPivot.rotation.x = chest.userData.lidAngle;
            }
        });
    }
};

window.ChestSystem = ChestSystem;

let showcaseBillboardTexture = null;

function getShowcaseBillboardTexture() {
    if (showcaseBillboardTexture) return showcaseBillboardTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 60 + Math.random() * 120;
        ctx.fillRect(x, y, size, 4);
    }

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 64px "Segoe UI", sans-serif';
    ctx.fillText('A1K CITY FEATURE TOUR', 60, 120);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'bold 46px "Segoe UI", sans-serif';
    ctx.fillText('Tree Houses • Floating Routes • Guarded Chests', 60, 200);

    ctx.font = '34px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dbeafe';
    ctx.fillText('Explore the new POIs and claim the loot!', 60, 270);

    ctx.font = '28px "Segoe UI", sans-serif';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('Tips: Look for pink map stars to find guarded chests.', 60, 340);

    showcaseBillboardTexture = new THREE.CanvasTexture(canvas);
    showcaseBillboardTexture.needsUpdate = true;
    return showcaseBillboardTexture;
}

function spawnShowcaseBillboard() {
    if (!window.Game || !window.Game.scene) return;

    const group = new THREE.Group();
    const texture = getShowcaseBillboardTexture();
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0x111111,
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true
    });

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.5), material);
    panel.position.y = 5;
    panel.rotation.y = Math.PI / 8;
    group.add(panel);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2 });
    const postGeo = new THREE.CylinderGeometry(0.25, 0.3, 8, 8);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-6, 4, -0.2);
    const rightPost = leftPost.clone();
    rightPost.position.x = 6;
    group.add(leftPost, rightPost);

    const spotLight = new THREE.SpotLight(0xfff1c1, 0.6, 30, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 10, 2);
    spotLight.target = panel;
    group.add(spotLight);
    group.add(spotLight.target);

    group.position.set(-12, 0, -18);
    window.Game.scene.add(group);
}

// spawnLoot - Spawn loot items in the world
function spawnLoot(pos, type = 'gold', valueOrId = 10) {
    if (!window.Game || !window.Game.scene) return null;

    // Simple loot spawn - create a gold coin mesh
    const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y = 0.5;
    mesh.rotation.x = Math.PI / 2;
    mesh.userData = { type: type, value: valueOrId, collected: false };
    window.Game.scene.add(mesh);

    // Animate rotation
    const anim = () => {
        if (mesh.userData && !mesh.userData.collected) {
            mesh.rotation.z += 0.05;
            requestAnimationFrame(anim);
        }
    };
    anim();

    return mesh;
}

// createWorld - Initialize the game world
function createWorld() {
    if (!window.Game || !window.Game.scene) return;

    // Ground (replaced by city road mesh, but keep for fallback)
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.1; // Below road mesh
    window.Game.scene.add(ground);

    // Initialize City Generator (replaces random buildings)
    if (typeof CityGenerator !== 'undefined' && CityGenerator.init) {
        CityGenerator.init();
    } else {
        // Fallback: Random buildings if CityGenerator not available
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        for (let i = 0; i < 50; i++) {
            const buildingMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2, Math.random() * 0.5 + 0.2),
                roughness: 0.8
            });
            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.scale.set(
                Math.random() * 10 + 5,
                Math.random() * 40 + 10,
                Math.random() * 10 + 5
            );
            building.position.set(
                (Math.random() - 0.5) * 400,
                building.scale.y / 2,
                (Math.random() - 0.5) * 400
            );
            building.castShadow = true;
            building.receiveShadow = true;
            window.Game.scene.add(building);
        }
    }

    // Populate world with interactive objects
    if (typeof spawnRandomBreakables === 'function') {
        spawnRandomBreakables(28);
    }
    if (window.PlatformSystem && typeof window.PlatformSystem.spawnRandomPlatforms === 'function') {
        window.PlatformSystem.spawnRandomPlatforms(10);
    }
    if (window.TreeHouseSystem && typeof window.TreeHouseSystem.spawnTreeHouses === 'function') {
        window.TreeHouseSystem.spawnTreeHouses(4);
    }
    if (window.ChestSystem && typeof window.ChestSystem.spawnGuardedChests === 'function') {
        window.ChestSystem.spawnGuardedChests(6);
    }
    spawnShowcaseBillboard();
}

// Export to window for global access
window.CityGenerator = CityGenerator;
window.CityIntegritySystem = CityIntegritySystem;
window.EnvSystem = EnvSystem;
window.updateCityIntegrity = updateCityIntegrity;
window.spawnLoot = spawnLoot;
window.createWorld = createWorld;

// ===== PHYSICAL LOOT DROP SYSTEM =====
// Spawns 3D loot objects that can be collected by walking over them

window.spawnPhysicalLoot = function(position, itemData) {
    if (!window.Game || !window.Game.scene) return;

    // 1. Create 3D Mesh (A floating dodecahedron/orb)
    const geometry = new THREE.DodecahedronGeometry(0.4);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700, // Gold by default
        emissive: 0xffa500,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    });

    // Rarity Colors
    const rarity = itemData.rarity || 'common';
    if (rarity === 'rare') {
        material.color.setHex(0x4fc3f7); // Blue
        material.emissive.setHex(0x00aaff);
    } else if (rarity === 'epic') {
        material.color.setHex(0xa78bfa); // Purple
        material.emissive.setHex(0x7c3aed);
    } else if (rarity === 'legendary') {
        material.color.setHex(0xffd700); // Gold
        material.emissive.setHex(0xffaa00);
    } else if (rarity === 'uncommon') {
        material.color.setHex(0x4caf50); // Green
        material.emissive.setHex(0x2e7d32);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 1.0; // Float above ground

    // 2. Add Data
    mesh.userData = {
        isLoot: true,
        item: itemData,
        bobOffset: Math.random() * Math.PI,
        collected: false
    };

    // 3. Add to Scene
    window.Game.scene.add(mesh);

    // 4. Add to a global loot array for update loop
    if (!window.Game.lootItems) window.Game.lootItems = [];
    window.Game.lootItems.push(mesh);

    return mesh;
};

// Update Loop for Loot (Bobbing & Pickup)
// Call this from your main animate() loop in game-core.js
window.updateLoot = function(dt, playerPosition) {
    if (!window.Game || !window.Game.lootItems) return;

    const pickupRadius = 2.5;
    const rotateSpeed = 1.5;
    const bobSpeed = 0.003;
    const bobAmplitude = 0.2;

    for (let i = window.Game.lootItems.length - 1; i >= 0; i--) {
        const mesh = window.Game.lootItems[i];

        if (!mesh || !mesh.userData || mesh.userData.collected) {
            window.Game.lootItems.splice(i, 1);
            continue;
        }

        // Animation: Rotate and bob
        mesh.rotation.y += rotateSpeed * dt;
        const bobTime = Date.now() * bobSpeed + mesh.userData.bobOffset;
        mesh.position.y = 1.0 + Math.sin(bobTime) * bobAmplitude;

        // Collision Check
        if (playerPosition && playerPosition.distanceTo(mesh.position) < pickupRadius) {
            // PICKUP!
            if (typeof window.collectWorldItem === 'function') {
                window.collectWorldItem(mesh.userData.item);
            }

            // Visual feedback - scale down and fade out
            const fadeOut = () => {
                if (mesh.material) {
                    mesh.material.opacity = Math.max(0, (mesh.material.opacity || 1) - dt * 5);
                    mesh.scale.multiplyScalar(0.95);
                    if (mesh.material.opacity <= 0) {
                        window.Game.scene.remove(mesh);
                        window.Game.lootItems.splice(i, 1);
                    }
                }
            };

            mesh.userData.collected = true;
            if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = 1.0;
            }

            // Fade out over 0.2 seconds
            const fadeInterval = setInterval(() => {
                if (mesh.material && mesh.material.opacity > 0) {
                    mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.1);
                    mesh.scale.multiplyScalar(0.95);
                    if (mesh.material.opacity <= 0) {
                        clearInterval(fadeInterval);
                        if (window.Game && window.Game.scene) {
                            window.Game.scene.remove(mesh);
                        }
                    }
                } else {
                    clearInterval(fadeInterval);
                }
            }, 20);
        }
    }
};
