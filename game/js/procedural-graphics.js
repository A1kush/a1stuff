/**
 * Procedural Graphics System
 * Phase 1: Procedural Particle System with canvas-based sprite generation
 * Generates procedural sprites for particles, effects, and visual elements
 */

(function() {
    'use strict';

    // ============================================
    // PROCEDURAL SPRITE GENERATOR
    // ============================================
    class ProceduralSpriteGenerator {
        constructor() {
            this.cache = new Map();
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }

        /**
         * Generate a procedural particle sprite
         * @param {string} type - Particle type: 'fire', 'ice', 'lightning', 'energy', 'smoke', 'spark'
         * @param {number} size - Size in pixels
         * @param {object} color - Color object with r, g, b, a
         * @returns {HTMLCanvasElement} Generated sprite canvas
         */
        generateParticleSprite(type, size = 32, color = null) {
            const cacheKey = `${type}_${size}_${color ? `${color.r}_${color.g}_${color.b}` : 'default'}`;

            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            switch(type) {
                case 'fire':
                    this._generateFireParticle(ctx, size, color);
                    break;
                case 'ice':
                    this._generateIceParticle(ctx, size, color);
                    break;
                case 'lightning':
                    this._generateLightningParticle(ctx, size, color);
                    break;
                case 'energy':
                    this._generateEnergyParticle(ctx, size, color);
                    break;
                case 'smoke':
                    this._generateSmokeParticle(ctx, size, color);
                    break;
                case 'spark':
                    this._generateSparkParticle(ctx, size, color);
                    break;
                default:
                    this._generateDefaultParticle(ctx, size, color);
            }

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        _generateFireParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 255, g: 100, b: 0, a: 1 };

            // Outer glow
            const outerGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.6);
            outerGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.6)`);
            outerGradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g * 0.6}, 0, 0.3)`);
            outerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
            ctx.fillStyle = outerGradient;
            ctx.fillRect(0, 0, size, size);

            // Core flame
            const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.3);
            coreGradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
            coreGradient.addColorStop(0.3, `rgba(${baseColor.r}, ${baseColor.g}, 0, 0.9)`);
            coreGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g * 0.5}, 0, 0)`);
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Flame tendrils
            ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, 0, 0.8)`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.lineTo(
                    center + Math.cos(angle) * size * 0.4,
                    center + Math.sin(angle) * size * 0.4
                );
                ctx.stroke();
            }
        }

        _generateIceParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 100, g: 200, b: 255, a: 1 };

            // Outer glow
            const outerGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.5);
            outerGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.4)`);
            outerGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
            ctx.fillStyle = outerGradient;
            ctx.fillRect(0, 0, size, size);

            // Core crystal
            const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.25);
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            coreGradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.9)`);
            coreGradient.addColorStop(1, `rgba(${baseColor.r * 0.5}, ${baseColor.g * 0.7}, ${baseColor.b}, 0)`);
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Ice crystals
            ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.lineTo(
                    center + Math.cos(angle) * size * 0.35,
                    center + Math.sin(angle) * size * 0.35
                );
                ctx.stroke();
            }
        }

        _generateLightningParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 255, g: 255, b: 100, a: 1 };

            // Electric glow
            const glowGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.5);
            glowGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.8)`);
            glowGradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.4)`);
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, size, size);

            // Core spark
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Lightning branches
            ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.9)`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3 + Math.PI / 6;
                ctx.beginPath();
                ctx.moveTo(center, center);
                const endX = center + Math.cos(angle) * size * 0.4;
                const endY = center + Math.sin(angle) * size * 0.4;
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Branch tip
                ctx.fillStyle = `rgba(255, 255, 255, 1)`;
                ctx.beginPath();
                ctx.arc(endX, endY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        _generateEnergyParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 0, g: 255, b: 200, a: 1 };

            // Energy orb
            const orbGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.4);
            orbGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`);
            orbGradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.6)`);
            orbGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
            ctx.fillStyle = orbGradient;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(center, center, size * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Orbiting particles
            ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.8)`;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                const x = center + Math.cos(angle) * size * 0.3;
                const y = center + Math.sin(angle) * size * 0.3;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        _generateSmokeParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 100, g: 100, b: 100, a: 1 };

            // Soft smoke cloud
            const smokeGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.5);
            smokeGradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.6)`);
            smokeGradient.addColorStop(0.5, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.3)`);
            smokeGradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
            ctx.fillStyle = smokeGradient;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Wispy tendrils
            ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.4)`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.quadraticCurveTo(
                    center + Math.cos(angle) * size * 0.2,
                    center + Math.sin(angle) * size * 0.2,
                    center + Math.cos(angle) * size * 0.4,
                    center + Math.sin(angle) * size * 0.4
                );
                ctx.stroke();
            }
        }

        _generateSparkParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 255, g: 200, b: 0, a: 1 };

            // Spark core
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Spark rays
            ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.9)`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.lineTo(
                    center + Math.cos(angle) * size * 0.4,
                    center + Math.sin(angle) * size * 0.4
                );
                ctx.stroke();
            }
        }

        _generateDefaultParticle(ctx, size, color) {
            const center = size / 2;
            const baseColor = color || { r: 255, g: 255, b: 255, a: 1 };

            const gradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.5);
            gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`);
            gradient.addColorStop(1, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(center, center, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        /**
         * Convert canvas to THREE.js texture
         */
        canvasToTexture(canvas) {
            return new THREE.CanvasTexture(canvas);
        }

        /**
         * Convert canvas to THREE.js sprite material
         */
        canvasToSpriteMaterial(canvas) {
            const texture = this.canvasToTexture(canvas);
            texture.needsUpdate = true;
            return new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
        }
    }

    // ============================================
    // PROCEDURAL PARTICLE SYSTEM
    // ============================================
    class ProceduralParticleSystem {
        constructor(scene) {
            this.scene = scene;
            this.particles = [];
            this.pool = [];
            this.maxPoolSize = 500;
            this.spriteGenerator = new ProceduralSpriteGenerator();
            this.textureCache = new Map();
        }

        /**
         * Create a particle from pool or new
         */
        _getParticle() {
            if (this.pool.length > 0) {
                return this.pool.pop();
            }
            return {
                sprite: null,
                material: null,
                mesh: null,
                active: false,
                age: 0,
                lifetime: 1,
                velocity: new THREE.Vector3(),
                position: new THREE.Vector3(),
                rotation: new THREE.Euler(),
                scale: 1,
                color: { r: 255, g: 255, b: 255, a: 1 }
            };
        }

        /**
         * Return particle to pool
         */
        _returnToPool(particle) {
            if (this.pool.length < this.maxPoolSize) {
                particle.active = false;
                if (particle.mesh) {
                    particle.mesh.visible = false;
                }
                this.pool.push(particle);
            } else if (particle.mesh) {
                this.scene.remove(particle.mesh);
                if (particle.material) {
                    particle.material.dispose();
                }
            }
        }

        /**
         * Emit particles
         * @param {object} config - Particle configuration
         */
        emit(config) {
            const {
                position = new THREE.Vector3(),
                type = 'energy',
                count = 10,
                size = 32,
                color = null,
                velocity = new THREE.Vector3(0, 1, 0),
                spread = Math.PI / 4,
                lifetime = 1,
                speed = 1,
                gravity = 0
            } = config;

            // Get or create texture
            const textureKey = `${type}_${size}_${color ? `${color.r}_${color.g}_${color.b}` : 'default'}`;
            let texture = this.textureCache.get(textureKey);
            if (!texture) {
                const sprite = this.spriteGenerator.generateParticleSprite(type, size, color);
                texture = this.spriteGenerator.canvasToTexture(sprite);
                texture.needsUpdate = true;
                this.textureCache.set(textureKey, texture);
            }

            for (let i = 0; i < count; i++) {
                const particle = this._getParticle();

                // Set properties
                particle.position.copy(position);
                particle.age = 0;
                particle.lifetime = lifetime + (Math.random() - 0.5) * lifetime * 0.2;
                particle.scale = 1;
                particle.active = true;
                particle.color = color || { r: 255, g: 255, b: 255, a: 1 };

                // Random velocity direction
                const angle = Math.random() * spread - spread / 2;
                const speedVariation = speed * (0.8 + Math.random() * 0.4);
                particle.velocity.copy(velocity);
                particle.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                particle.velocity.multiplyScalar(speedVariation);
                particle.velocity.y += gravity;

                // Create sprite if needed
                if (!particle.material) {
                    particle.material = new THREE.SpriteMaterial({
                        map: texture.clone(),
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                } else {
                    particle.material.map = texture.clone();
                }

                if (!particle.mesh) {
                    particle.mesh = new THREE.Sprite(particle.material);
                    this.scene.add(particle.mesh);
                } else {
                    particle.mesh.visible = true;
                }

                particle.mesh.position.copy(particle.position);
                particle.mesh.scale.set(size / 100, size / 100, 1);

                this.particles.push(particle);
            }
        }

        /**
         * Update all particles
         */
        update(deltaTime) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];

                if (!particle.active) {
                    this.particles.splice(i, 1);
                    this._returnToPool(particle);
                    continue;
                }

                particle.age += deltaTime;

                if (particle.age >= particle.lifetime) {
                    particle.active = false;
                    continue;
                }

                // Update position
                particle.position.add(
                    particle.velocity.clone().multiplyScalar(deltaTime)
                );

                // Update scale (fade out)
                const lifeRatio = particle.age / particle.lifetime;
                particle.scale = 1 - lifeRatio * 0.5;

                // Update opacity
                const alpha = 1 - lifeRatio;
                if (particle.material) {
                    particle.material.opacity = alpha;
                }

                // Update mesh
                if (particle.mesh) {
                    particle.mesh.position.copy(particle.position);
                    particle.mesh.scale.setScalar(particle.scale * (particle.mesh.userData.baseScale || 1));
                }
            }
        }

        /**
         * Create particle trail effect
         */
        createTrail(startPos, endPos, type = 'energy', count = 5) {
            const direction = endPos.clone().sub(startPos);
            const distance = direction.length();
            const step = distance / count;

            for (let i = 0; i < count; i++) {
                const t = i / count;
                const pos = startPos.clone().add(direction.clone().multiplyScalar(t));

                this.emit({
                    position: pos,
                    type: type,
                    count: 1,
                    size: 16,
                    lifetime: 0.3,
                    velocity: new THREE.Vector3(0, 0, 0),
                    speed: 0
                });
            }
        }

        /**
         * Clear all particles
         */
        clear() {
            for (const particle of this.particles) {
                if (particle.mesh) {
                    this.scene.remove(particle.mesh);
                }
            }
            this.particles = [];
        }
    }

    // Export to window
    window.ProceduralSpriteGenerator = ProceduralSpriteGenerator;
    window.ProceduralParticleSystem = ProceduralParticleSystem;

    console.log('[ProceduralGraphics] Phase 1: Procedural Particle System loaded');
})();
