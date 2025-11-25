/**
 * Procedural Rendering System
 * Phase 17-20: Post-processing, sprite atlas, performance optimization, and integration
 */

(function() {
    'use strict';

    // ============================================
    // PROCEDURAL POST-PROCESSING (Phase 17)
    // ============================================
    class ProceduralPostProcessing {
        constructor(renderer, scene, camera) {
            this.renderer = renderer;
            this.scene = scene;
            this.camera = camera;
            this.effects = {
                bloom: false,
                glow: false,
                colorGrading: false,
                vignette: false,
                filmGrain: false,
                motionBlur: false
            };
            this.compositeCanvas = null;
            this.compositeCtx = null;
            this.setupComposite();
        }

        /**
         * Phase 17: Setup composite canvas for post-processing
         */
        setupComposite() {
            this.compositeCanvas = document.createElement('canvas');
            this.compositeCanvas.width = window.innerWidth;
            this.compositeCanvas.height = window.innerHeight;
            this.compositeCtx = this.compositeCanvas.getContext('2d');
        }

        /**
         * Phase 17: Apply bloom effect
         */
        applyBloom(intensity = 0.5) {
            this.effects.bloom = true;
            this.effects.bloomIntensity = intensity;
        }

        /**
         * Phase 17: Apply glow effect
         */
        applyGlow(intensity = 0.3) {
            this.effects.glow = true;
            this.effects.glowIntensity = intensity;
        }

        /**
         * Phase 17: Apply color grading
         */
        applyColorGrading(preset = 'default') {
            this.effects.colorGrading = true;
            this.effects.colorPreset = preset;
        }

        /**
         * Phase 17: Apply vignette
         */
        applyVignette(intensity = 0.5) {
            this.effects.vignette = true;
            this.effects.vignetteIntensity = intensity;
        }

        /**
         * Phase 17: Apply film grain
         */
        applyFilmGrain(intensity = 0.1) {
            this.effects.filmGrain = true;
            this.effects.grainIntensity = intensity;
        }

        /**
         * Phase 17: Apply motion blur
         */
        applyMotionBlur(intensity = 0.5) {
            this.effects.motionBlur = true;
            this.effects.blurIntensity = intensity;
        }

        /**
         * Phase 17: Render with post-processing
         */
        render() {
            // Render scene to texture
            const renderTarget = new THREE.WebGLRenderTarget(
                window.innerWidth,
                window.innerHeight
            );
            this.renderer.setRenderTarget(renderTarget);
            this.renderer.render(this.scene, this.camera);
            this.renderer.setRenderTarget(null);

            // Get rendered image
            const imageData = this.renderer.domElement.toDataURL();
            const img = new Image();
            img.src = imageData;

            // Apply post-processing on composite canvas
            this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            this.compositeCtx.drawImage(img, 0, 0);

            // Apply effects
            if (this.effects.bloom) {
                this._applyBloomEffect();
            }
            if (this.effects.glow) {
                this._applyGlowEffect();
            }
            if (this.effects.colorGrading) {
                this._applyColorGrading();
            }
            if (this.effects.vignette) {
                this._applyVignette();
            }
            if (this.effects.filmGrain) {
                this._applyFilmGrain();
            }

            // Draw to screen
            const screenCtx = document.createElement('canvas').getContext('2d');
            screenCtx.drawImage(this.compositeCanvas, 0, 0);
        }

        _applyBloomEffect() {
            const imageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (brightness > 200) {
                    const bloom = (brightness - 200) / 55 * this.effects.bloomIntensity * 255;
                    data[i] = Math.min(255, data[i] + bloom);
                    data[i + 1] = Math.min(255, data[i + 1] + bloom);
                    data[i + 2] = Math.min(255, data[i + 2] + bloom);
                }
            }

            this.compositeCtx.putImageData(imageData, 0, 0);
        }

        _applyGlowEffect() {
            this.compositeCtx.shadowBlur = 20 * this.effects.glowIntensity;
            this.compositeCtx.shadowColor = '#ffffff';
            const imageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            this.compositeCtx.putImageData(imageData, 0, 0);
            this.compositeCtx.shadowBlur = 0;
        }

        _applyColorGrading() {
            const presets = {
                'default': { r: 1, g: 1, b: 1 },
                'warm': { r: 1.1, g: 1.0, b: 0.9 },
                'cool': { r: 0.9, g: 1.0, b: 1.1 },
                'vibrant': { r: 1.2, g: 1.1, b: 1.0 }
            };

            const preset = presets[this.effects.colorPreset] || presets.default;
            const imageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * preset.r);
                data[i + 1] = Math.min(255, data[i + 1] * preset.g);
                data[i + 2] = Math.min(255, data[i + 2] * preset.b);
            }

            this.compositeCtx.putImageData(imageData, 0, 0);
        }

        _applyVignette() {
            const centerX = this.compositeCanvas.width / 2;
            const centerY = this.compositeCanvas.height / 2;
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

            const imageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            const data = imageData.data;

            for (let y = 0; y < this.compositeCanvas.height; y++) {
                for (let x = 0; x < this.compositeCanvas.width; x++) {
                    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    const vignette = 1 - (dist / maxDist) * this.effects.vignetteIntensity;
                    const i = (y * this.compositeCanvas.width + x) * 4;
                    data[i] *= vignette;
                    data[i + 1] *= vignette;
                    data[i + 2] *= vignette;
                }
            }

            this.compositeCtx.putImageData(imageData, 0, 0);
        }

        _applyFilmGrain() {
            const imageData = this.compositeCtx.getImageData(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const grain = (Math.random() - 0.5) * this.effects.grainIntensity * 255;
                data[i] = Math.max(0, Math.min(255, data[i] + grain));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
            }

            this.compositeCtx.putImageData(imageData, 0, 0);
        }
    }

    // ============================================
    // PROCEDURAL SPRITE ATLAS GENERATOR (Phase 18)
    // ============================================
    class ProceduralSpriteAtlasGenerator {
        constructor() {
            this.atlases = new Map();
            this.maxAtlasSize = 2048;
        }

        /**
         * Phase 18: Generate sprite atlas
         */
        generateAtlas(sprites, atlasName = 'default') {
            if (this.atlases.has(atlasName)) {
                return this.atlases.get(atlasName);
            }

            // Calculate atlas size
            const spriteCount = sprites.length;
            const cols = Math.ceil(Math.sqrt(spriteCount));
            const rows = Math.ceil(spriteCount / cols);
            const spriteSize = Math.max(...sprites.map(s => Math.max(s.width || 64, s.height || 64)));
            const atlasWidth = cols * spriteSize;
            const atlasHeight = rows * spriteSize;

            // Create atlas canvas
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(atlasWidth, this.maxAtlasSize);
            canvas.height = Math.min(atlasHeight, this.maxAtlasSize);
            const ctx = canvas.getContext('2d');

            // Draw sprites
            const spriteMap = {};
            let x = 0, y = 0;
            let currentRow = 0;

            for (let i = 0; i < sprites.length; i++) {
                const sprite = sprites[i];
                const spriteCanvas = sprite.canvas || sprite;

                if (x + spriteSize > canvas.width) {
                    x = 0;
                    y += spriteSize;
                    currentRow++;
                }

                ctx.drawImage(spriteCanvas, x, y, spriteSize, spriteSize);

                spriteMap[sprite.id || i] = {
                    x: x / canvas.width,
                    y: y / canvas.height,
                    width: spriteSize / canvas.width,
                    height: spriteSize / canvas.height
                };

                x += spriteSize;
            }

            const atlas = {
                canvas: canvas,
                texture: new THREE.CanvasTexture(canvas),
                spriteMap: spriteMap,
                spriteSize: spriteSize
            };

            this.atlases.set(atlasName, atlas);
            return atlas;
        }

        /**
         * Phase 18: Get sprite from atlas
         */
        getSpriteFromAtlas(atlasName, spriteId) {
            const atlas = this.atlases.get(atlasName);
            if (!atlas) return null;

            const spriteInfo = atlas.spriteMap[spriteId];
            if (!spriteInfo) return null;

            return {
                texture: atlas.texture,
                uv: spriteInfo
            };
        }

        /**
         * Phase 18: Compress atlas
         */
        compressAtlas(atlasName, quality = 0.8) {
            const atlas = this.atlases.get(atlasName);
            if (!atlas) return;

            const compressed = atlas.canvas.toDataURL('image/jpeg', quality);
            const img = new Image();
            img.src = compressed;

            const canvas = document.createElement('canvas');
            canvas.width = atlas.canvas.width;
            canvas.height = atlas.canvas.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            atlas.canvas = canvas;
            atlas.texture = new THREE.CanvasTexture(canvas);
        }
    }

    // ============================================
    // PERFORMANCE OPTIMIZATION (Phase 19)
    // ============================================
    class ProceduralPerformanceOptimizer {
        constructor() {
            this.objectPools = new Map();
            this.lodLevels = { high: 1.0, medium: 0.7, low: 0.5 };
            this.currentLOD = 'high';
            this.cullingEnabled = true;
        }

        /**
         * Phase 19: Create object pool
         */
        createPool(type, factory, initialSize = 10) {
            const pool = {
                objects: [],
                factory: factory,
                active: new Set()
            };

            for (let i = 0; i < initialSize; i++) {
                pool.objects.push(factory());
            }

            this.objectPools.set(type, pool);
            return pool;
        }

        /**
         * Phase 19: Get object from pool
         */
        getFromPool(type) {
            const pool = this.objectPools.get(type);
            if (!pool) return null;

            let obj = pool.objects.pop();
            if (!obj) {
                obj = pool.factory();
            }

            pool.active.add(obj);
            return obj;
        }

        /**
         * Phase 19: Return object to pool
         */
        returnToPool(type, obj) {
            const pool = this.objectPools.get(type);
            if (!pool) return;

            pool.active.delete(obj);
            pool.objects.push(obj);
        }

        /**
         * Phase 19: Set LOD level
         */
        setLODLevel(level) {
            this.currentLOD = level;
        }

        /**
         * Phase 19: Get LOD scale
         */
        getLODScale() {
            return this.lodLevels[this.currentLOD] || 1.0;
        }

        /**
         * Phase 19: Check if object should be culled
         */
        shouldCull(position, camera, maxDistance = 100) {
            if (!this.cullingEnabled) return false;

            const distance = position.distanceTo(camera.position);
            return distance > maxDistance;
        }

        /**
         * Phase 19: Optimize particle count based on performance
         */
        optimizeParticleCount(baseCount, fps) {
            if (fps > 55) return baseCount;
            if (fps > 30) return Math.floor(baseCount * 0.7);
            if (fps > 15) return Math.floor(baseCount * 0.4);
            return Math.floor(baseCount * 0.2);
        }
    }

    // ============================================
    // FINAL INTEGRATION (Phase 20)
    // ============================================
    class ProceduralGraphicsIntegration {
        constructor(scene, camera, renderer) {
            this.scene = scene;
            this.camera = camera;
            this.renderer = renderer;

            // Initialize all systems
            this.particleSystem = new window.ProceduralParticleSystem(scene);
            this.skillEffects = new window.ProceduralSkillEffects(scene, this.particleSystem);
            this.environmentalEffects = new window.ProceduralEnvironmentalEffects(scene, this.particleSystem);
            this.characterRenderer = new window.ProceduralCharacterRenderer();
            this.characterVisualStates = new window.ProceduralCharacterVisualStates(scene);
            this.buildingTextures = new window.ProceduralBuildingTextures();
            this.cityEnhancements = new window.ProceduralCityEnhancements(scene);
            this.props = new window.ProceduralProps(scene);
            this.environmentalLighting = new window.ProceduralEnvironmentalLighting(scene);
            this.uiIcons = new window.ProceduralUIIcons();
            this.hudVisuals = new window.ProceduralHUDVisuals();
            this.uiFeedback = new window.ProceduralUIFeedback();
            this.damageNumbers = new window.ProceduralDamageNumbers(scene);
            this.postProcessing = new ProceduralPostProcessing(renderer, scene, camera);
            this.spriteAtlas = new ProceduralSpriteAtlasGenerator();
            this.performanceOptimizer = new ProceduralPerformanceOptimizer();

            // Quality settings
            this.qualitySettings = {
                low: {
                    particleCount: 0.3,
                    lod: 'low',
                    postProcessing: false
                },
                medium: {
                    particleCount: 0.6,
                    lod: 'medium',
                    postProcessing: true
                },
                high: {
                    particleCount: 1.0,
                    lod: 'high',
                    postProcessing: true
                }
            };
            this.currentQuality = 'medium';
        }

        /**
         * Phase 20: Set quality level
         */
        setQuality(level) {
            this.currentQuality = level;
            const settings = this.qualitySettings[level];

            if (settings) {
                this.performanceOptimizer.setLODLevel(settings.lod);
                if (!settings.postProcessing) {
                    this.postProcessing.effects = {
                        bloom: false,
                        glow: false,
                        colorGrading: false,
                        vignette: false,
                        filmGrain: false,
                        motionBlur: false
                    };
                }
            }
        }

        /**
         * Phase 20: Update all systems
         */
        update(deltaTime) {
            this.particleSystem.update(deltaTime);
        }

        /**
         * Phase 20: Get effect preset
         */
        getEffectPreset(presetName) {
            const presets = {
                'combat': {
                    particles: true,
                    screenShake: true,
                    damageNumbers: true
                },
                'exploration': {
                    particles: false,
                    screenShake: false,
                    damageNumbers: false
                },
                'boss': {
                    particles: true,
                    screenShake: true,
                    damageNumbers: true,
                    postProcessing: true
                }
            };
            return presets[presetName] || presets.combat;
        }
    }

    // Export to window
    window.ProceduralPostProcessing = ProceduralPostProcessing;
    window.ProceduralSpriteAtlasGenerator = ProceduralSpriteAtlasGenerator;
    window.ProceduralPerformanceOptimizer = ProceduralPerformanceOptimizer;
    window.ProceduralGraphicsIntegration = ProceduralGraphicsIntegration;

    console.log('[ProceduralRendering] Phase 17-20: Advanced rendering systems loaded');
})();
