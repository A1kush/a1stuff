/**
 * Procedural UI System
 * Phase 13-16: UI icons, HUD visuals, feedback effects, and damage numbers
 */

(function() {
    'use strict';

    // ============================================
    // PROCEDURAL UI ICONS (Phase 13)
    // ============================================
    class ProceduralUIIcons {
        constructor() {
            this.cache = new Map();
        }

        /**
         * Phase 13: Generate skill icon
         */
        generateSkillIcon(skillType, size = 64, color = null) {
            const cacheKey = `skill_${skillType}_${size}_${color || 'default'}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const baseColor = color || this._getSkillColor(skillType);
            const center = size / 2;

            // Background circle
            const bgGradient = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
            bgGradient.addColorStop(0, baseColor);
            bgGradient.addColorStop(1, this._darkenColor(baseColor, 0.5));
            ctx.fillStyle = bgGradient;
            ctx.beginPath();
            ctx.arc(center, center, size / 2 - 2, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Icon symbol based on type
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;

            switch(skillType) {
                case 'attack':
                    this._drawSwordIcon(ctx, center, size);
                    break;
                case 'magic':
                    this._drawMagicIcon(ctx, center, size);
                    break;
                case 'heal':
                    this._drawHealIcon(ctx, center, size);
                    break;
                case 'buff':
                    this._drawBuffIcon(ctx, center, size);
                    break;
                default:
                    this._drawGenericIcon(ctx, center, size);
            }

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        /**
         * Phase 13: Generate item icon with rarity
         */
        generateItemIcon(itemType, rarity = 'common', size = 64) {
            const cacheKey = `item_${itemType}_${rarity}_${size}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const rarityColors = {
                'common': '#888888',
                'uncommon': '#00ff00',
                'rare': '#0088ff',
                'epic': '#aa00ff',
                'legendary': '#ffaa00'
            };

            const bgColor = rarityColors[rarity] || '#888888';
            const center = size / 2;

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, size, size);

            // Item shape
            ctx.fillStyle = '#ffffff';
            switch(itemType) {
                case 'weapon':
                    ctx.fillRect(center - size * 0.2, center - size * 0.3, size * 0.4, size * 0.6);
                    break;
                case 'armor':
                    ctx.fillRect(center - size * 0.25, center - size * 0.25, size * 0.5, size * 0.5);
                    break;
                case 'consumable':
                    ctx.beginPath();
                    ctx.arc(center, center, size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }

            // Rarity glow
            ctx.strokeStyle = bgColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(2, 2, size - 4, size - 4);

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        /**
         * Phase 13: Generate status effect icon
         */
        generateStatusEffectIcon(effectType, size = 32) {
            const cacheKey = `status_${effectType}_${size}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const colors = {
                'buff': '#00ff00',
                'debuff': '#ff0000',
                'stun': '#ffff00',
                'burn': '#ff6600',
                'freeze': '#00ccff',
                'poison': '#9900ff'
            };

            const color = colors[effectType] || '#ffffff';
            const center = size / 2;

            // Background
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(center, center, size / 2 - 2, 0, Math.PI * 2);
            ctx.fill();

            // Symbol
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const symbols = {
                'buff': '+',
                'debuff': '-',
                'stun': '!',
                'burn': '🔥',
                'freeze': '❄',
                'poison': '☠'
            };
            ctx.fillText(symbols[effectType] || '?', center, center);

            this.cache.set(cacheKey, canvas);
            return canvas;
        }

        _drawSwordIcon(ctx, center, size) {
            ctx.beginPath();
            ctx.moveTo(center, center - size * 0.3);
            ctx.lineTo(center, center + size * 0.3);
            ctx.moveTo(center - size * 0.15, center - size * 0.1);
            ctx.lineTo(center + size * 0.15, center - size * 0.1);
            ctx.stroke();
        }

        _drawMagicIcon(ctx, center, size) {
            ctx.beginPath();
            ctx.arc(center, center, size * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(center, center - size * 0.3);
            ctx.lineTo(center, center + size * 0.3);
            ctx.moveTo(center - size * 0.3, center);
            ctx.lineTo(center + size * 0.3, center);
            ctx.stroke();
        }

        _drawHealIcon(ctx, center, size) {
            ctx.beginPath();
            ctx.moveTo(center, center - size * 0.2);
            ctx.lineTo(center - size * 0.15, center);
            ctx.lineTo(center, center + size * 0.2);
            ctx.lineTo(center + size * 0.15, center);
            ctx.closePath();
            ctx.fill();
        }

        _drawBuffIcon(ctx, center, size) {
            ctx.beginPath();
            ctx.arc(center, center, size * 0.25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillText('+', center, center);
        }

        _drawGenericIcon(ctx, center, size) {
            ctx.beginPath();
            ctx.arc(center, center, size * 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }

        _getSkillColor(skillType) {
            const colors = {
                'attack': '#ff0000',
                'magic': '#0088ff',
                'heal': '#00ff00',
                'buff': '#ffff00'
            };
            return colors[skillType] || '#888888';
        }

        _darkenColor(color, factor) {
            if (typeof color === 'string' && color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
            }
            return color;
        }

        canvasToTexture(canvas) {
            return new THREE.CanvasTexture(canvas);
        }
    }

    // ============================================
    // ENHANCED HUD VISUALS (Phase 14)
    // ============================================
    class ProceduralHUDVisuals {
        constructor() {
            this.bars = new Map();
        }

        /**
         * Phase 14: Create procedural health bar
         */
        createHealthBar(elementId, maxValue, currentValue, options = {}) {
            const {
                width = 200,
                height = 20,
                color = '#00ff00',
                backgroundColor = '#333333',
                showText = true
            } = options;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            // Health fill with gradient
            const ratio = currentValue / maxValue;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, ratio > 0.5 ? '#00ff00' : '#ffff00');
            gradient.addColorStop(1, ratio > 0.5 ? '#00cc00' : '#ff0000');
            ctx.fillStyle = gradient;
            ctx.fillRect(2, 2, (width - 4) * ratio, height - 4);

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, width - 2, height - 2);
            ctx.shadowBlur = 0;

            // Text
            if (showText) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.floor(currentValue)}/${Math.floor(maxValue)}`, width / 2, height / 2);
            }

            this.bars.set(elementId, canvas);
            return canvas;
        }

        /**
         * Phase 14: Create procedural XP bar
         */
        createXPBar(elementId, currentXP, nextLevelXP, options = {}) {
            const {
                width = 200,
                height = 15,
                color = '#0088ff'
            } = options;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#222222';
            ctx.fillRect(0, 0, width, height);

            // XP fill
            const ratio = currentXP / nextLevelXP;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this._lightenColor(color, 1.5));
            ctx.fillStyle = gradient;
            ctx.fillRect(2, 2, (width - 4) * ratio, height - 4);

            // Glow
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(1, 1, width - 2, height - 2);

            this.bars.set(elementId, canvas);
            return canvas;
        }

        /**
         * Phase 14: Create cooldown indicator
         */
        createCooldownIndicator(size = 64, progress = 0) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const center = size / 2;
            const radius = size / 2 - 4;

            // Background circle
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();

            // Cooldown arc
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();

            // Center text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.ceil((1 - progress) * 10), center, center);

            return canvas;
        }

        _lightenColor(color, factor) {
            if (typeof color === 'string' && color.startsWith('#')) {
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);
                return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
            }
            return color;
        }
    }

    // ============================================
    // UI FEEDBACK EFFECTS (Phase 15)
    // ============================================
    class ProceduralUIFeedback {
        constructor() {
            this.notifications = [];
        }

        /**
         * Phase 15: Create notification
         */
        createNotification(text, type = 'info', duration = 3000) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: #ffffff;
                padding: 15px 20px;
                border-radius: 8px;
                border: 2px solid ${this._getNotificationColor(type)};
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            notification.textContent = text;
            document.body.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);

            // Animate out and remove
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, duration);

            this.notifications.push(notification);
            return notification;
        }

        /**
         * Phase 15: Create tooltip
         */
        createTooltip(text, x, y) {
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                background: rgba(0, 0, 0, 0.9);
                color: #ffffff;
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #00ffff;
                pointer-events: none;
                z-index: 10001;
                font-family: Arial, sans-serif;
                font-size: 12px;
                max-width: 200px;
                transform: translate(-50%, -100%) translateY(-10px);
                opacity: 0;
                transition: opacity 0.2s, transform 0.2s;
            `;
            tooltip.textContent = text;
            document.body.appendChild(tooltip);

            setTimeout(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'translate(-50%, -100%)';
            }, 10);

            return tooltip;
        }

        /**
         * Phase 15: Button press feedback
         */
        createButtonFeedback(buttonElement) {
            const originalTransform = buttonElement.style.transform;
            buttonElement.style.transition = 'transform 0.1s';
            buttonElement.style.transform = 'scale(0.95)';

            setTimeout(() => {
                buttonElement.style.transform = originalTransform || 'scale(1)';
            }, 100);
        }

        _getNotificationColor(type) {
            const colors = {
                'info': '#0088ff',
                'success': '#00ff00',
                'warning': '#ffaa00',
                'error': '#ff0000'
            };
            return colors[type] || '#888888';
        }
    }

    // ============================================
    // DAMAGE NUMBERS (Phase 16)
    // ============================================
    class ProceduralDamageNumbers {
        constructor(scene) {
            this.scene = scene;
            this.numbers = [];
        }

        /**
         * Phase 16: Create floating damage number
         */
        createDamageNumber(position, damage, isCrit = false, isHeal = false) {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');

            const color = isHeal ? '#00ff00' : (isCrit ? '#ffaa00' : '#ffffff');
            const size = isCrit ? 24 : 18;

            ctx.fillStyle = color;
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Shadow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#000000';
            ctx.fillText(isHeal ? `+${damage}` : `-${damage}`, 50, 20);
            ctx.shadowBlur = 0;

            // Crit indicator
            if (isCrit) {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('CRIT!', 50, 35);
            }

            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            }));
            sprite.position.copy(position);
            sprite.position.y += 2;
            sprite.scale.set(1, 0.4, 1);

            this.scene.add(sprite);

            // Animate
            const startTime = Date.now();
            const duration = 1000;
            const startY = sprite.position.y;
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                3,
                (Math.random() - 0.5) * 2
            );

            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    const progress = elapsed / duration;
                    sprite.position.add(velocity.clone().multiplyScalar(0.016));
                    sprite.material.opacity = 1 - progress;
                    sprite.scale.multiplyScalar(1.01);
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(sprite);
                    sprite.material.dispose();
                    texture.dispose();
                }
            };
            animate();

            this.numbers.push(sprite);
            return sprite;
        }

        /**
         * Phase 16: Create combo counter
         */
        createComboCounter(position, combo) {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${combo}x`, 60, 30);

            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            }));
            sprite.position.copy(position);
            sprite.position.y += 3;
            sprite.scale.set(1.2, 0.6, 1);

            this.scene.add(sprite);
            return sprite;
        }
    }

    // Export to window
    window.ProceduralUIIcons = ProceduralUIIcons;
    window.ProceduralHUDVisuals = ProceduralHUDVisuals;
    window.ProceduralUIFeedback = ProceduralUIFeedback;
    window.ProceduralDamageNumbers = ProceduralDamageNumbers;

    console.log('[ProceduralUI] Phase 13-16: UI systems loaded');
})();
