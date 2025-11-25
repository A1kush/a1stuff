/**
 * Procedural Sprites System
 * Phase 5-8: Character sprite generation and animation
 */

(function() {
    'use strict';

    // ============================================
    // PROCEDURAL CHARACTER RENDERER
    // ============================================
    class ProceduralCharacterRenderer {
        constructor() {
            this.cache = new Map();
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }

        /**
         * Phase 5: Generate procedural character sprite
         */
        generateCharacterSprite(characterId, animState = 'idle', frame = 0, options = {}) {
            const {
                scale = 1,
                facingLeft = false,
                color = null,
                accessories = []
            } = options;

            const cacheKey = `${characterId}_${animState}_${frame}_${scale}_${facingLeft}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const size = 64 * scale;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            ctx.save();
            if (facingLeft) {
                ctx.translate(size, 0);
                ctx.scale(-1, 1);
            }

            // Get character-specific colors
            const charColors = this._getCharacterColors(characterId, color);

            // Draw character based on ID
            switch(characterId) {
                case 'A1':
                    this._drawA1(ctx, size, charColors, animState, frame);
                    break;
                case 'MISSY':
                    this._drawMissy(ctx, size, charColors, animState, frame);
                    break;
                case 'UNIQUE':
                    this._drawUnique(ctx, size, charColors, animState, frame);
                    break;
                default:
                    this._drawGenericCharacter(ctx, size, charColors, animState, frame);
            }

            // Draw accessories
            accessories.forEach(acc => {
                this._drawAccessory(ctx, size, acc, animState, frame);
            });

            ctx.restore();

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        /**
         * Phase 6: Draw A1 character with enhanced details
         */
        _drawA1(ctx, size, colors, animState, frame) {
            const centerX = size / 2;
            const baseY = size * 0.8;
            const bob = animState === 'run' ? Math.sin(frame * 0.3) * 2 : 0;

            // Body (armor)
            ctx.fillStyle = colors.body;
            ctx.fillRect(centerX - size * 0.15, baseY - size * 0.3 + bob, size * 0.3, size * 0.4);

            // Armor plates
            ctx.fillStyle = colors.accent;
            ctx.fillRect(centerX - size * 0.12, baseY - size * 0.25 + bob, size * 0.24, size * 0.05);
            ctx.fillRect(centerX - size * 0.12, baseY - size * 0.15 + bob, size * 0.24, size * 0.05);

            // Head
            ctx.fillStyle = colors.head;
            ctx.beginPath();
            ctx.arc(centerX, baseY - size * 0.45 + bob, size * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Cape (if idle)
            if (animState === 'idle') {
                ctx.fillStyle = colors.cape;
                ctx.beginPath();
                ctx.moveTo(centerX - size * 0.2, baseY - size * 0.2 + bob);
                ctx.quadraticCurveTo(centerX, baseY - size * 0.1 + bob, centerX + size * 0.2, baseY - size * 0.2 + bob);
                ctx.lineTo(centerX + size * 0.15, baseY + size * 0.1);
                ctx.lineTo(centerX - size * 0.15, baseY + size * 0.1);
                ctx.closePath();
                ctx.fill();
            }

            // Sword
            const swordAngle = animState === 'attack' ? -Math.PI / 4 : Math.PI / 8;
            ctx.save();
            ctx.translate(centerX + size * 0.2, baseY - size * 0.2 + bob);
            ctx.rotate(swordAngle);
            ctx.fillStyle = colors.weapon;
            ctx.fillRect(0, -size * 0.15, size * 0.08, size * 0.3);
            ctx.restore();
        }

        /**
         * Phase 6: Draw Missy character
         */
        _drawMissy(ctx, size, colors, animState, frame) {
            const centerX = size / 2;
            const baseY = size * 0.8;
            const bob = animState === 'run' ? Math.sin(frame * 0.3) * 2 : 0;

            // Body (dress)
            ctx.fillStyle = colors.body;
            ctx.beginPath();
            ctx.moveTo(centerX, baseY + size * 0.1);
            ctx.lineTo(centerX - size * 0.2, baseY - size * 0.2 + bob);
            ctx.lineTo(centerX + size * 0.2, baseY - size * 0.2 + bob);
            ctx.closePath();
            ctx.fill();

            // Head
            ctx.fillStyle = colors.head;
            ctx.beginPath();
            ctx.arc(centerX, baseY - size * 0.45 + bob, size * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Staff
            const staffY = baseY - size * 0.3 + bob;
            ctx.strokeStyle = colors.weapon;
            ctx.lineWidth = size * 0.03;
            ctx.beginPath();
            ctx.moveTo(centerX - size * 0.25, staffY);
            ctx.lineTo(centerX - size * 0.25, baseY - size * 0.5 + bob);
            ctx.stroke();

            // Staff gem glow
            if (animState === 'attack') {
                const glowSize = size * 0.08 * (1 + Math.sin(frame * 0.5) * 0.3);
                const glowGradient = ctx.createRadialGradient(
                    centerX - size * 0.25, baseY - size * 0.5 + bob,
                    0, centerX - size * 0.25, baseY - size * 0.5 + bob, glowSize
                );
                glowGradient.addColorStop(0, colors.accent);
                glowGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(centerX - size * 0.25, baseY - size * 0.5 + bob, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Staff gem
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(centerX - size * 0.25, baseY - size * 0.5 + bob, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        /**
         * Phase 6: Draw Unique character
         */
        _drawUnique(ctx, size, colors, animState, frame) {
            const centerX = size / 2;
            const baseY = size * 0.8;
            const bob = animState === 'run' ? Math.sin(frame * 0.3) * 2 : 0;

            // Body (tech suit)
            ctx.fillStyle = colors.body;
            ctx.fillRect(centerX - size * 0.12, baseY - size * 0.3 + bob, size * 0.24, size * 0.4);

            // Tech details
            ctx.fillStyle = colors.accent;
            ctx.fillRect(centerX - size * 0.1, baseY - size * 0.25 + bob, size * 0.2, size * 0.02);
            ctx.fillRect(centerX - size * 0.1, baseY - size * 0.15 + bob, size * 0.2, size * 0.02);

            // Head
            ctx.fillStyle = colors.head;
            ctx.beginPath();
            ctx.arc(centerX, baseY - size * 0.45 + bob, size * 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Gun
            const gunAngle = animState === 'attack' ? -Math.PI / 6 : 0;
            ctx.save();
            ctx.translate(centerX + size * 0.15, baseY - size * 0.15 + bob);
            ctx.rotate(gunAngle);
            ctx.fillStyle = colors.weapon;
            ctx.fillRect(0, -size * 0.05, size * 0.2, size * 0.1);
            // Gun barrel
            ctx.fillRect(size * 0.2, -size * 0.03, size * 0.08, size * 0.06);
            // Muzzle flash
            if (animState === 'attack' && frame % 2 === 0) {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(size * 0.28, -size * 0.05, size * 0.06, size * 0.1);
            }
            ctx.restore();
        }

        /**
         * Generic character fallback
         */
        _drawGenericCharacter(ctx, size, colors, animState, frame) {
            const centerX = size / 2;
            const baseY = size * 0.8;

            // Body
            ctx.fillStyle = colors.body;
            ctx.fillRect(centerX - size * 0.15, baseY - size * 0.3, size * 0.3, size * 0.4);

            // Head
            ctx.fillStyle = colors.head;
            ctx.beginPath();
            ctx.arc(centerX, baseY - size * 0.45, size * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }

        /**
         * Phase 6: Draw accessory
         */
        _drawAccessory(ctx, size, accessory, animState, frame) {
            const { type, position, color, size: accSize } = accessory;
            const centerX = size / 2;
            const baseY = size * 0.8;

            ctx.fillStyle = color || '#ffffff';
            switch(type) {
                case 'helmet':
                    ctx.beginPath();
                    ctx.arc(centerX, baseY - size * 0.45, accSize || size * 0.1, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'shield':
                    ctx.fillRect(centerX - size * 0.25, baseY - size * 0.2, accSize || size * 0.15, accSize || size * 0.2);
                    break;
                case 'wing':
                    // Simple wing shape
                    ctx.beginPath();
                    ctx.moveTo(centerX + size * 0.2, baseY - size * 0.3);
                    ctx.quadraticCurveTo(centerX + size * 0.3, baseY - size * 0.4, centerX + size * 0.25, baseY - size * 0.2);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }

        /**
         * Phase 7: Generate animation frame
         */
        generateAnimationFrame(characterId, animState, frame, options = {}) {
            return this.generateCharacterSprite(characterId, animState, frame, options);
        }

        /**
         * Get character colors
         */
        _getCharacterColors(characterId, overrideColor) {
            const defaults = {
                'A1': {
                    body: '#ff4d4f',
                    head: '#ff9999',
                    weapon: '#c0c0c0',
                    accent: '#8b0000',
                    cape: '#660000'
                },
                'MISSY': {
                    body: '#ff69b4',
                    head: '#ffb3d9',
                    weapon: '#8a2be2',
                    accent: '#ff00ff',
                    cape: '#ff1493'
                },
                'UNIQUE': {
                    body: '#00e5ff',
                    head: '#80f0ff',
                    weapon: '#333333',
                    accent: '#00ffff',
                    cape: '#0099cc'
                }
            };

            const colors = defaults[characterId] || {
                body: '#888888',
                head: '#cccccc',
                weapon: '#666666',
                accent: '#aaaaaa',
                cape: '#444444'
            };

            if (overrideColor) {
                colors.body = overrideColor;
            }

            return colors;
        }

        /**
         * Convert canvas to THREE.js texture
         */
        canvasToTexture(canvas) {
            return new THREE.CanvasTexture(canvas);
        }
    }

    // ============================================
    // CHARACTER ANIMATION SYSTEM (Phase 7)
    // ============================================
    class ProceduralCharacterAnimation {
        constructor(characterRenderer) {
            this.renderer = characterRenderer;
            this.animations = new Map();
        }

        /**
         * Create animation sequence
         */
        createAnimation(characterId, animState, frameCount, duration = 1.0) {
            const frames = [];
            for (let i = 0; i < frameCount; i++) {
                const canvas = this.renderer.generateAnimationFrame(characterId, animState, i);
                frames.push(this.renderer.canvasToTexture(canvas));
            }

            return {
                frames: frames,
                frameCount: frameCount,
                duration: duration,
                frameTime: duration / frameCount
            };
        }

        /**
         * Get animation frame at time
         */
        getFrameAtTime(animation, time) {
            const frameIndex = Math.floor((time % animation.duration) / animation.frameTime);
            return animation.frames[Math.min(frameIndex, animation.frames.length - 1)];
        }
    }

    // ============================================
    // CHARACTER VISUAL STATES (Phase 8)
    // ============================================
    class ProceduralCharacterVisualStates {
        constructor(scene) {
            this.scene = scene;
            this.healthBars = new Map();
            this.statusEffects = new Map();
        }

        /**
         * Phase 8: Create health bar above character
         */
        createHealthBar(characterId, position, maxHP, currentHP) {
            if (!this.healthBars.has(characterId)) {
                // Create health bar canvas
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 8;
                const ctx = canvas.getContext('2d');

                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, 64, 8);

                // Health bar
                const healthRatio = currentHP / maxHP;
                const gradient = ctx.createLinearGradient(0, 0, 64, 0);
                gradient.addColorStop(0, healthRatio > 0.5 ? '#00ff00' : '#ffff00');
                gradient.addColorStop(1, healthRatio > 0.5 ? '#00cc00' : '#ff0000');
                ctx.fillStyle = gradient;
                ctx.fillRect(1, 1, 62 * healthRatio, 6);

                const texture = new THREE.CanvasTexture(canvas);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
                sprite.position.copy(position);
                sprite.position.y += 2.5;
                sprite.scale.set(0.5, 0.1, 1);

                this.scene.add(sprite);
                this.healthBars.set(characterId, sprite);
            } else {
                // Update existing health bar
                const sprite = this.healthBars.get(characterId);
                const canvas = sprite.material.map.image;
                const ctx = canvas.getContext('2d');

                ctx.clearRect(0, 0, 64, 8);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, 64, 8);

                const healthRatio = currentHP / maxHP;
                const gradient = ctx.createLinearGradient(0, 0, 64, 0);
                gradient.addColorStop(0, healthRatio > 0.5 ? '#00ff00' : '#ffff00');
                gradient.addColorStop(1, healthRatio > 0.5 ? '#00cc00' : '#ff0000');
                ctx.fillStyle = gradient;
                ctx.fillRect(1, 1, 62 * healthRatio, 6);

                sprite.material.map.needsUpdate = true;
            }
        }

        /**
         * Phase 8: Add status effect indicator
         */
        addStatusEffect(characterId, effectType, position) {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');

            const colors = {
                'buff': '#00ff00',
                'debuff': '#ff0000',
                'stun': '#ffff00',
                'burn': '#ff6600',
                'freeze': '#00ccff'
            };

            ctx.fillStyle = colors[effectType] || '#ffffff';
            ctx.beginPath();
            ctx.arc(8, 8, 6, 0, Math.PI * 2);
            ctx.fill();

            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.position.copy(position);
            sprite.position.y += 2.8;
            sprite.scale.set(0.2, 0.2, 1);

            this.scene.add(sprite);

            if (!this.statusEffects.has(characterId)) {
                this.statusEffects.set(characterId, []);
            }
            this.statusEffects.get(characterId).push(sprite);
        }

        /**
         * Phase 8: Create name tag
         */
        createNameTag(characterId, name, position, color = '#ffffff') {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, 128, 32);

            ctx.fillStyle = color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 64, 16);

            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.position.copy(position);
            sprite.position.y += 3.2;
            sprite.scale.set(0.8, 0.2, 1);

            this.scene.add(sprite);
            return sprite;
        }

        /**
         * Remove character visuals
         */
        removeCharacterVisuals(characterId) {
            if (this.healthBars.has(characterId)) {
                this.scene.remove(this.healthBars.get(characterId));
                this.healthBars.delete(characterId);
            }
            if (this.statusEffects.has(characterId)) {
                this.statusEffects.get(characterId).forEach(sprite => {
                    this.scene.remove(sprite);
                });
                this.statusEffects.delete(characterId);
            }
        }
    }

    // Export to window
    window.ProceduralCharacterRenderer = ProceduralCharacterRenderer;
    window.ProceduralCharacterAnimation = ProceduralCharacterAnimation;
    window.ProceduralCharacterVisualStates = ProceduralCharacterVisualStates;

    console.log('[ProceduralSprites] Phase 5-8: Character sprite generation loaded');
})();
