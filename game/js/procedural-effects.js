/**
 * Procedural Effects System
 * Phase 2-4: Enhanced visual effects using procedural generation
 */

(function() {
    'use strict';

    // ============================================
    // ENHANCED SKILL VISUAL EFFECTS
    // ============================================
    class ProceduralSkillEffects {
        constructor(scene, particleSystem) {
            this.scene = scene;
            this.particleSystem = particleSystem;
            this.spriteGenerator = window.ProceduralSpriteGenerator ? new window.ProceduralSpriteGenerator() : null;
        }

        /**
         * Phase 2: Enhanced sword slash with multi-layer rendering
         */
        createEnhancedSwordSlash(pos, angle, color, radius, element = 'PHYSICAL') {
            const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            const targetPos = pos.clone().add(direction.clone().multiplyScalar(radius));

            // Create multi-layer slash effect
            const group = new THREE.Group();
            group.position.copy(pos);
            group.position.y += 1.2;
            group.lookAt(targetPos);
            group.rotateX(Math.PI / 2);
            group.rotateZ(Math.PI / 2);

            // Layer 1: Outer glow
            const outerGeometry = new THREE.RingGeometry(1.8, 2.5, 32, 1, 0, Math.PI);
            const outerMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.4,
                emissive: color,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
            group.add(outerMesh);

            // Layer 2: Core slash
            const coreGeometry = new THREE.RingGeometry(1.5, 2.0, 32, 1, 0, Math.PI);
            const coreMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                emissive: color,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
            group.add(coreMesh);

            // Layer 3: Inner flash
            const flashGeometry = new THREE.RingGeometry(1.2, 1.5, 16, 1, 0, Math.PI);
            const flashMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                emissive: 0xffffff,
                emissiveIntensity: 2.0,
                side: THREE.DoubleSide
            });
            const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
            group.add(flashMesh);

            // Add particle trail
            if (this.particleSystem) {
                const elementType = this._getElementParticleType(element);
                this.particleSystem.createTrail(pos, targetPos, elementType, 8);
            }

            this.scene.add(group);

            // Animate and remove
            const lifetime = 0.4;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < lifetime) {
                    const progress = elapsed / lifetime;
                    group.rotation.z += 0.1;
                    outerMaterial.opacity = 0.4 * (1 - progress);
                    coreMaterial.opacity = 0.8 * (1 - progress);
                    flashMaterial.opacity = (1 - progress);
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(group);
                    outerMaterial.dispose();
                    coreMaterial.dispose();
                    flashMaterial.dispose();
                    outerGeometry.dispose();
                    coreGeometry.dispose();
                    flashGeometry.dispose();
                }
            };
            animate();

            return group;
        }

        /**
         * Phase 2: Procedural beam effect (Kamehameha-style)
         */
        createBeamEffect(sourcePos, targetPos, element = 'ENERGY', chargeLevel = 1.0) {
            const direction = targetPos.clone().sub(sourcePos);
            const length = direction.length();
            const normalizedDir = direction.normalize();

            const group = new THREE.Group();
            const color = this._getElementColor(element);

            // Base width scales with charge
            const baseWidth = 0.2 * chargeLevel;
            const maxWidth = 0.5 * chargeLevel;

            // Layer 1: Outer aura
            const outerGeometry = new THREE.CylinderGeometry(maxWidth, baseWidth, length, 16);
            const outerMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                emissive: color,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);
            group.add(outerMesh);

            // Layer 2: Core beam
            const coreGeometry = new THREE.CylinderGeometry(baseWidth * 0.7, baseWidth * 0.5, length, 16);
            const coreMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                emissive: color,
                emissiveIntensity: 1.5,
                side: THREE.DoubleSide
            });
            const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
            group.add(coreMesh);

            // Layer 3: Inner core
            const innerGeometry = new THREE.CylinderGeometry(baseWidth * 0.3, baseWidth * 0.2, length, 8);
            const innerMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                emissive: 0xffffff,
                emissiveIntensity: 2.0
            });
            const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
            group.add(innerMesh);

            // Position and orient
            group.position.copy(sourcePos.clone().add(targetPos).multiplyScalar(0.5));
            group.lookAt(targetPos);
            group.rotateX(Math.PI / 2);

            // Add particles along beam
            if (this.particleSystem) {
                const elementType = this._getElementParticleType(element);
                for (let i = 0; i < 10; i++) {
                    const t = i / 10;
                    const pos = sourcePos.clone().add(normalizedDir.clone().multiplyScalar(length * t));
                    this.particleSystem.emit({
                        position: pos,
                        type: elementType,
                        count: 1,
                        size: 16,
                        lifetime: 0.2,
                        velocity: normalizedDir.clone().multiplyScalar(5),
                        speed: 5
                    });
                }
            }

            this.scene.add(group);
            return group;
        }

        /**
         * Phase 2: Procedural explosion effect
         */
        createExplosionEffect(pos, element = 'FIRE', radius = 5) {
            const group = new THREE.Group();
            group.position.copy(pos);
            const color = this._getElementColor(element);

            // Shockwave ring
            const ringGeometry = new THREE.RingGeometry(0, radius * 0.3, 32);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                emissive: color,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = -Math.PI / 2;
            group.add(ringMesh);

            // Core explosion sphere
            const sphereGeometry = new THREE.SphereGeometry(radius * 0.5, 16, 16);
            const sphereMaterial = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.9,
                emissive: color,
                emissiveIntensity: 1.5
            });
            const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            group.add(sphereMesh);

            // Inner flash
            const flashGeometry = new THREE.SphereGeometry(radius * 0.2, 8, 8);
            const flashMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                emissive: 0xffffff,
                emissiveIntensity: 3.0
            });
            const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
            group.add(flashMesh);

            // Add explosion particles
            if (this.particleSystem) {
                const elementType = this._getElementParticleType(element);
                this.particleSystem.emit({
                    position: pos,
                    type: elementType,
                    count: 20,
                    size: 24,
                    lifetime: 0.8,
                    velocity: new THREE.Vector3(0, 1, 0),
                    spread: Math.PI * 2,
                    speed: 10,
                    gravity: -2
                });
            }

            this.scene.add(group);

            // Animate explosion
            const lifetime = 0.5;
            const startTime = Date.now();
            const maxRadius = radius;
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < lifetime) {
                    const progress = elapsed / lifetime;
                    const currentRadius = maxRadius * progress;

                    // Expand ring
                    ringGeometry.dispose();
                    const newRingGeo = new THREE.RingGeometry(0, currentRadius, 32);
                    ringMesh.geometry = newRingGeo;

                    // Fade out
                    ringMaterial.opacity = 0.8 * (1 - progress);
                    sphereMaterial.opacity = 0.9 * (1 - progress);
                    flashMaterial.opacity = (1 - progress);

                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(group);
                    ringMaterial.dispose();
                    sphereMaterial.dispose();
                    flashMaterial.dispose();
                    ringGeometry.dispose();
                    sphereGeometry.dispose();
                    flashGeometry.dispose();
                }
            };
            animate();

            return group;
        }

        /**
         * Phase 3: Hit spark generation
         */
        createHitSpark(pos, element = 'PHYSICAL', intensity = 1.0) {
            if (!this.particleSystem) return;

            const elementType = this._getElementParticleType(element);
            const color = this._getElementColor(element);

            this.particleSystem.emit({
                position: pos,
                type: 'spark',
                count: Math.floor(5 * intensity),
                size: 16,
                color: { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff },
                lifetime: 0.3,
                velocity: new THREE.Vector3(0, 0, 0),
                spread: Math.PI * 2,
                speed: 3 * intensity
            });
        }

        /**
         * Phase 3: Screen shake effect
         */
        createScreenShake(intensity = 1.0, duration = 0.3) {
            if (!window.camera) return;

            const originalPosition = window.camera.position.clone();
            const startTime = Date.now();
            const shakeAmount = intensity * 0.1;

            const shake = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < duration) {
                    const progress = elapsed / duration;
                    const fade = 1 - progress;

                    window.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeAmount * fade;
                    window.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeAmount * fade;
                    window.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeAmount * fade;

                    requestAnimationFrame(shake);
                } else {
                    window.camera.position.copy(originalPosition);
                }
            };
            shake();
        }

        /**
         * Helper: Get element color
         */
        _getElementColor(element) {
            const colors = {
                'FIRE': 0xff6600,
                'ICE': 0x00ccff,
                'LIGHTNING': 0xffff00,
                'SHADOW': 0x6600cc,
                'LIGHT': 0xffffff,
                'PLASMA': 0x00ffff,
                'ENERGY': 0x00ff00,
                'ARCANE': 0xff00ff,
                'PHYSICAL': 0xff0000
            };
            return colors[element] || 0xffffff;
        }

        /**
         * Helper: Get particle type for element
         */
        _getElementParticleType(element) {
            const types = {
                'FIRE': 'fire',
                'ICE': 'ice',
                'LIGHTNING': 'lightning',
                'SHADOW': 'smoke',
                'LIGHT': 'energy',
                'PLASMA': 'energy',
                'ENERGY': 'energy',
                'ARCANE': 'energy',
                'PHYSICAL': 'spark'
            };
            return types[element] || 'energy';
        }
    }

    // ============================================
    // ENVIRONMENTAL EFFECTS (Phase 4)
    // ============================================
    class ProceduralEnvironmentalEffects {
        constructor(scene, particleSystem) {
            this.scene = scene;
            this.particleSystem = particleSystem;
            this.activeEffects = [];
        }

        /**
         * Phase 4: Create rain effect
         */
        createRain(intensity = 1.0, area = 50) {
            if (!this.particleSystem) return;

            const rainInterval = setInterval(() => {
                for (let i = 0; i < Math.floor(10 * intensity); i++) {
                    const x = (Math.random() - 0.5) * area;
                    const z = (Math.random() - 0.5) * area;
                    const y = 20;

                    this.particleSystem.emit({
                        position: new THREE.Vector3(x, y, z),
                        type: 'energy',
                        count: 1,
                        size: 4,
                        color: { r: 150, g: 200, b: 255 },
                        lifetime: 2.0,
                        velocity: new THREE.Vector3(0, -10, 0),
                        speed: 10
                    });
                }
            }, 100);

            this.activeEffects.push({ type: 'rain', interval: rainInterval });
            return rainInterval;
        }

        /**
         * Phase 4: Create snow effect
         */
        createSnow(intensity = 1.0, area = 50) {
            if (!this.particleSystem) return;

            const snowInterval = setInterval(() => {
                for (let i = 0; i < Math.floor(5 * intensity); i++) {
                    const x = (Math.random() - 0.5) * area;
                    const z = (Math.random() - 0.5) * area;
                    const y = 20;

                    this.particleSystem.emit({
                        position: new THREE.Vector3(x, y, z),
                        type: 'ice',
                        count: 1,
                        size: 8,
                        lifetime: 5.0,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 2,
                            -2,
                            (Math.random() - 0.5) * 2
                        ),
                        speed: 2,
                        gravity: -0.5
                    });
                }
            }, 200);

            this.activeEffects.push({ type: 'snow', interval: snowInterval });
            return snowInterval;
        }

        /**
         * Phase 4: Create fog/mist effect
         */
        createFog(density = 1.0, area = 50) {
            if (!this.particleSystem) return;

            const fogInterval = setInterval(() => {
                for (let i = 0; i < Math.floor(3 * density); i++) {
                    const x = (Math.random() - 0.5) * area;
                    const z = (Math.random() - 0.5) * area;
                    const y = Math.random() * 5;

                    this.particleSystem.emit({
                        position: new THREE.Vector3(x, y, z),
                        type: 'smoke',
                        count: 1,
                        size: 40,
                        color: { r: 200, g: 200, b: 200 },
                        lifetime: 10.0,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            Math.random() * 0.3,
                            (Math.random() - 0.5) * 0.5
                        ),
                        speed: 0.5
                    });
                }
            }, 500);

            this.activeEffects.push({ type: 'fog', interval: fogInterval });
            return fogInterval;
        }

        /**
         * Phase 4: Create light rays (god rays)
         */
        createLightRays(pos, count = 5, intensity = 1.0) {
            const group = new THREE.Group();
            group.position.copy(pos);

            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const length = 20;
                const width = 0.5;

                const geometry = new THREE.PlaneGeometry(width, length);
                const material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3 * intensity,
                    emissive: 0xffffff,
                    emissiveIntensity: intensity,
                    side: THREE.DoubleSide
                });

                const ray = new THREE.Mesh(geometry, material);
                ray.rotation.z = angle;
                ray.position.y = length / 2;
                group.add(ray);
            }

            this.scene.add(group);
            this.activeEffects.push({ type: 'lightRays', mesh: group });
            return group;
        }

        /**
         * Clear all environmental effects
         */
        clearAll() {
            for (const effect of this.activeEffects) {
                if (effect.interval) {
                    clearInterval(effect.interval);
                }
                if (effect.mesh) {
                    this.scene.remove(effect.mesh);
                }
            }
            this.activeEffects = [];
        }
    }

    // Export to window
    window.ProceduralSkillEffects = ProceduralSkillEffects;
    window.ProceduralEnvironmentalEffects = ProceduralEnvironmentalEffects;

    console.log('[ProceduralEffects] Phase 2-4: Enhanced visual effects loaded');
})();
