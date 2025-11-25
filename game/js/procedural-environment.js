/**
 * Procedural Environment System
 * Phase 9-12: Building textures, city generation, props, and lighting
 */

(function() {
    'use strict';

    // ============================================
    // PROCEDURAL BUILDING TEXTURES (Phase 9)
    // ============================================
    class ProceduralBuildingTextures {
        constructor() {
            this.cache = new Map();
        }

        /**
         * Phase 9: Generate procedural building facade
         */
        generateBuildingFacade(width = 256, height = 512, style = 'modern') {
            const cacheKey = `${width}_${height}_${style}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Base color
            ctx.fillStyle = '#888888';
            ctx.fillRect(0, 0, width, height);

            switch(style) {
                case 'modern':
                    this._generateModernFacade(ctx, width, height);
                    break;
                case 'brick':
                    this._generateBrickFacade(ctx, width, height);
                    break;
                case 'concrete':
                    this._generateConcreteFacade(ctx, width, height);
                    break;
                default:
                    this._generateModernFacade(ctx, width, height);
            }

            // Add windows
            this._addWindows(ctx, width, height, style);

            // Add details
            this._addBuildingDetails(ctx, width, height, style);

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        _generateModernFacade(ctx, width, height) {
            // Vertical panels
            const panelCount = 4;
            const panelWidth = width / panelCount;
            const colors = ['#999999', '#aaaaaa', '#888888', '#777777'];

            for (let i = 0; i < panelCount; i++) {
                ctx.fillStyle = colors[i % colors.length];
                ctx.fillRect(i * panelWidth, 0, panelWidth, height);
            }
        }

        _generateBrickFacade(ctx, width, height) {
            const brickWidth = 32;
            const brickHeight = 16;
            const colors = ['#8b4513', '#a0522d', '#cd853f'];

            for (let y = 0; y < height; y += brickHeight) {
                const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                for (let x = -offset; x < width; x += brickWidth) {
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.fillRect(x, y, brickWidth - 2, brickHeight - 2);
                }
            }
        }

        _generateConcreteFacade(ctx, width, height) {
            // Concrete texture with noise
            const imageData = ctx.createImageData(width, height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                const noise = Math.random() * 30;
                imageData.data[i] = 120 + noise;     // R
                imageData.data[i + 1] = 120 + noise; // G
                imageData.data[i + 2] = 120 + noise; // B
                imageData.data[i + 3] = 255;         // A
            }
            ctx.putImageData(imageData, 0, 0);
        }

        _addWindows(ctx, width, height, style) {
            const windowWidth = 24;
            const windowHeight = 32;
            const floorHeight = 80;
            const windowsPerFloor = Math.floor(width / 40);

            for (let floor = 1; floor < Math.floor(height / floorHeight); floor++) {
                for (let i = 0; i < windowsPerFloor; i++) {
                    const x = (width / (windowsPerFloor + 1)) * (i + 1) - windowWidth / 2;
                    const y = height - (floor * floorHeight) - windowHeight / 2;

                    // Window frame
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(x - 2, y - 2, windowWidth + 4, windowHeight + 4);

                    // Window (lit or dark)
                    const isLit = Math.random() > 0.3;
                    ctx.fillStyle = isLit ? '#ffffaa' : '#000033';
                    ctx.fillRect(x, y, windowWidth, windowHeight);

                    // Window cross
                    if (isLit) {
                        ctx.strokeStyle = '#333333';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + windowWidth / 2, y);
                        ctx.lineTo(x + windowWidth / 2, y + windowHeight);
                        ctx.moveTo(x, y + windowHeight / 2);
                        ctx.lineTo(x + windowWidth, y + windowHeight / 2);
                        ctx.stroke();
                    }
                }
            }
        }

        _addBuildingDetails(ctx, width, height, style) {
            // Add signs
            if (Math.random() > 0.5) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(width * 0.3, height * 0.8, width * 0.4, height * 0.1);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('SHOP', width / 2, height * 0.87);
            }

            // Add decorations
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, height * 0.9);
            ctx.lineTo(width, height * 0.9);
            ctx.stroke();
        }

        /**
         * Phase 9: Generate building damage texture
         */
        generateDamagedFacade(baseTexture, damageLevel = 0.5) {
            const canvas = document.createElement('canvas');
            canvas.width = baseTexture.width;
            canvas.height = baseTexture.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(baseTexture, 0, 0);

            // Add cracks
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            for (let i = 0; i < damageLevel * 10; i++) {
                ctx.beginPath();
                const x1 = Math.random() * canvas.width;
                const y1 = Math.random() * canvas.height;
                const x2 = x1 + (Math.random() - 0.5) * 50;
                const y2 = y1 + (Math.random() - 0.5) * 50;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Add dark patches
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = 0; i < damageLevel * 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    Math.random() * 30 + 10,
                    0, Math.PI * 2
                );
                ctx.fill();
            }

            return canvas;
        }

        canvasToTexture(canvas) {
            return new THREE.CanvasTexture(canvas);
        }
    }

    // ============================================
    // PROCEDURAL CITY ENHANCEMENTS (Phase 10)
    // ============================================
    class ProceduralCityEnhancements {
        constructor(scene) {
            this.scene = scene;
            this.buildingTextures = new ProceduralBuildingTextures();
        }

        /**
         * Phase 10: Generate procedural road texture
         */
        generateRoadTexture(width = 512, height = 512) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Base asphalt
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, width, height);

            // Lane markings
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            ctx.setLineDash([20, 20]);

            const laneCount = 4;
            const laneWidth = width / laneCount;
            for (let i = 1; i < laneCount; i++) {
                ctx.beginPath();
                ctx.moveTo(i * laneWidth, 0);
                ctx.lineTo(i * laneWidth, height);
                ctx.stroke();
            }

            // Center line
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.setLineDash([30, 10]);
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.stroke();

            ctx.setLineDash([]);
            return canvas;
        }

        /**
         * Phase 10: Generate sidewalk texture
         */
        generateSidewalkTexture(width = 256, height = 256) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Base concrete
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(0, 0, width, height);

            // Add cracks and details
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * width, Math.random() * height);
                ctx.lineTo(Math.random() * width, Math.random() * height);
                ctx.stroke();
            }

            return canvas;
        }

        /**
         * Phase 10: Create street light
         */
        createStreetLight(position) {
            const group = new THREE.Group();

            // Pole
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
            const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 2.5;
            group.add(pole);

            // Light fixture
            const fixtureGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const fixtureMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffaa,
                emissive: 0xffffaa,
                emissiveIntensity: 1.0
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.y = 5;
            group.add(fixture);

            // Point light
            const light = new THREE.PointLight(0xffffaa, 1, 10);
            light.position.y = 5;
            group.add(light);

            group.position.copy(position);
            this.scene.add(group);
            return group;
        }

        /**
         * Phase 10: Generate vegetation sprite
         */
        generateVegetationSprite(type = 'tree', size = 64) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            switch(type) {
                case 'tree':
                    // Trunk
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(size * 0.45, size * 0.6, size * 0.1, size * 0.4);

                    // Foliage
                    ctx.fillStyle = '#228b22';
                    ctx.beginPath();
                    ctx.arc(size * 0.5, size * 0.5, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bush':
                    ctx.fillStyle = '#32cd32';
                    ctx.beginPath();
                    ctx.arc(size * 0.5, size * 0.6, size * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }

            return canvas;
        }
    }

    // ============================================
    // PROCEDURAL PROPS (Phase 11)
    // ============================================
    class ProceduralProps {
        constructor(scene) {
            this.scene = scene;
        }

        /**
         * Phase 11: Create procedural crate
         */
        createCrate(position, size = 1) {
            const group = new THREE.Group();

            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);

            // Add straps
            const strapGeometry = new THREE.BoxGeometry(size * 1.1, size * 0.1, size * 0.1);
            const strapMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
            const strap1 = new THREE.Mesh(strapGeometry, strapMaterial);
            strap1.position.y = size * 0.3;
            group.add(strap1);

            const strap2 = new THREE.Mesh(strapGeometry, strapMaterial);
            strap2.position.y = -size * 0.3;
            strap2.rotation.y = Math.PI / 2;
            group.add(strap2);

            group.position.copy(position);
            this.scene.add(group);
            return group;
        }

        /**
         * Phase 11: Create procedural barrel
         */
        createBarrel(position, size = 1) {
            const group = new THREE.Group();

            const geometry = new THREE.CylinderGeometry(size * 0.5, size * 0.5, size, 16);
            const material = new THREE.MeshStandardMaterial({ color: 0x654321 });
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);

            // Add metal bands
            const bandGeometry = new THREE.TorusGeometry(size * 0.5, size * 0.05, 8, 16);
            const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const band1 = new THREE.Mesh(bandGeometry, bandMaterial);
            band1.position.y = size * 0.3;
            group.add(band1);

            const band2 = new THREE.Mesh(bandGeometry, bandMaterial);
            band2.position.y = -size * 0.3;
            group.add(band2);

            group.position.copy(position);
            this.scene.add(group);
            return group;
        }

        /**
         * Phase 11: Create shop sign
         */
        createShopSign(position, text = 'SHOP', color = 0xff0000) {
            const group = new THREE.Group();

            // Sign board
            const boardGeometry = new THREE.PlaneGeometry(2, 0.5);
            const boardMaterial = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3
            });
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            group.add(board);

            // Pole
            const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
            const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = -1;
            group.add(pole);

            group.position.copy(position);
            this.scene.add(group);
            return group;
        }

        /**
         * Phase 11: Create interactive object highlight
         */
        createHighlight(position, radius = 1) {
            const geometry = new THREE.RingGeometry(radius * 0.8, radius, 32);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.5,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.copy(position);

            this.scene.add(mesh);

            // Animate pulse
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const pulse = 1 + Math.sin(elapsed * 2) * 0.2;
                mesh.scale.setScalar(pulse);
                material.opacity = 0.5 + Math.sin(elapsed * 2) * 0.3;
                requestAnimationFrame(animate);
            };
            animate();

            return mesh;
        }
    }

    // ============================================
    // ENVIRONMENTAL LIGHTING (Phase 12)
    // ============================================
    class ProceduralEnvironmentalLighting {
        constructor(scene) {
            this.scene = scene;
            this.ambientLight = null;
            this.directionalLight = null;
            this.timeOfDay = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
        }

        /**
         * Phase 12: Initialize lighting system
         */
        initialize() {
            // Ambient light
            this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(this.ambientLight);

            // Directional light (sun)
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            this.directionalLight.position.set(10, 10, 5);
            this.directionalLight.castShadow = true;
            this.scene.add(this.directionalLight);

            this.updateTimeOfDay(this.timeOfDay);
        }

        /**
         * Phase 12: Update time of day
         */
        updateTimeOfDay(time) {
            this.timeOfDay = time;

            // Sun position (circular path)
            const sunAngle = time * Math.PI * 2;
            const sunDistance = 20;
            this.directionalLight.position.x = Math.cos(sunAngle) * sunDistance;
            this.directionalLight.position.y = Math.sin(sunAngle) * sunDistance;
            this.directionalLight.position.z = 10;

            // Sun color based on time
            if (time < 0.25 || time > 0.75) {
                // Night
                this.directionalLight.color.setHex(0x4444ff);
                this.directionalLight.intensity = 0.3;
                this.ambientLight.color.setHex(0x222244);
                this.ambientLight.intensity = 0.2;
            } else if (time < 0.3 || time > 0.7) {
                // Dawn/Dusk
                this.directionalLight.color.setHex(0xff8844);
                this.directionalLight.intensity = 0.6;
                this.ambientLight.color.setHex(0xffaa88);
                this.ambientLight.intensity = 0.4;
            } else {
                // Day
                this.directionalLight.color.setHex(0xffffff);
                this.directionalLight.intensity = 1.0;
                this.ambientLight.color.setHex(0xffffff);
                this.ambientLight.intensity = 0.5;
            }
        }

        /**
         * Phase 12: Animate day/night cycle
         */
        animateDayNightCycle(duration = 60) {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const time = (elapsed / duration) % 1;
                this.updateTimeOfDay(time);
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    // Export to window
    window.ProceduralBuildingTextures = ProceduralBuildingTextures;
    window.ProceduralCityEnhancements = ProceduralCityEnhancements;
    window.ProceduralProps = ProceduralProps;
    window.ProceduralEnvironmentalLighting = ProceduralEnvironmentalLighting;

    console.log('[ProceduralEnvironment] Phase 9-12: Environment systems loaded');
})();
