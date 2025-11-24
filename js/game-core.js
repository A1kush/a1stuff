// Game Core - Main game loop, THREE.js setup, CharacterController, Enemy, and core game systems
// This module handles the main game initialization, rendering loop, and core game classes

// Initialize Game state object (must be declared early)
if (!window.Game) {
    window.Game = {
        autoAttack: false,
        paused: false,
        minions: [],
        cityIntegrity: 100,
        limitBreakMeter: 0,
        limitBreakMax: 100,
        limitBreakActive: false,
        scene: null,
        camera: null
    };
}

// THREE.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// WebGL Renderer with error handling
let renderer;
try {
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('gameCanvas'),
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
} catch (error) {
    console.error('WebGL Renderer creation failed:', error);
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.style.display = 'none';
    }
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:Arial;padding:20px;text-align:center;';
    errorDiv.innerHTML = `
        <h1 style="color:#ff0000;margin-bottom:20px;">WebGL Not Available</h1>
        <p style="font-size:18px;margin-bottom:10px;">Your browser or graphics driver does not support WebGL.</p>
        <p style="font-size:14px;opacity:0.8;margin-bottom:20px;">Please try:</p>
        <ul style="text-align:left;font-size:14px;opacity:0.8;">
            <li>Update your graphics drivers</li>
            <li>Try a different browser (Chrome, Firefox, Edge)</li>
            <li>Enable hardware acceleration in your browser settings</li>
            <li>Check if WebGL is enabled: <a href="https://get.webgl.org/" target="_blank" style="color:#00e5ff;">get.webgl.org</a></li>
        </ul>
    `;
    document.body.appendChild(errorDiv);
    throw new Error('WebGL context could not be created');
}

const clock = new THREE.Clock();

// Initialize Game state with camera and scene
window.Game.camera = camera;
window.Game.scene = scene;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// Global Collections
let party = [];
let enemies = [];
let projectiles = [];
let particleSystems = [];
let combatEngine = null; // Will be initialized in init()

// Asset Creation Functions
function createA1() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff4d4f, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.6), bodyMat);
    body.position.y = 0.75;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), bodyMat);
    head.position.y = 1.9;
    group.add(head);

    const swordMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.3 });
    const swordHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), new THREE.MeshStandardMaterial({color: 0x4a2c2c}));
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.2), swordMat);
    swordBlade.position.y = 0.95;
    const sword = new THREE.Group();
    sword.add(swordHilt, swordBlade);
    sword.position.set(0.6, 0.8, 0);
    sword.rotation.z = -Math.PI / 8;
    group.add(sword);
    group.userData.sword = sword;

    group.traverse(obj => {
        if(obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });
    return group;
}

function createMissy() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8), bodyMat);
    body.position.y = 0.75;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), bodyMat);
    head.position.y = 1.9;
    group.add(head);

    const staffMat = new THREE.MeshStandardMaterial({ color: 0x8a2be2, roughness: 0.4 });
    const staffGem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({color: 0xff00ff, emissive: 0xaa00aa, roughness: 0.1}));
    staffGem.position.y = 2.2;
    const staffRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), staffMat);
    staffRod.position.y = 1.1;
    const staff = new THREE.Group();
    staff.add(staffRod, staffGem);
    staff.position.set(-0.6, 0, 0);
    group.add(staff);
    group.userData.staffGem = staffGem;

    group.traverse(obj => {
        if(obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });
    return group;
}

function createUnique() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.5), bodyMat);
    body.position.y = 0.8;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), bodyMat);
    head.position.y = 2.0;
    group.add(head);

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), gunMat);
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), gunMat);
    gunBarrel.rotation.z = Math.PI / 2;
    gunBarrel.position.x = 0.8;
    const gun = new THREE.Group();
    gun.add(gunBody, gunBarrel);
    gun.position.set(0.6, 1.0, 0);
    group.add(gun);
    group.userData.gun = gun;

    group.traverse(obj => {
        if(obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });
    return group;
}

function createEnemy() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), bodyMat);
    body.position.y = 0.9;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), bodyMat);
    head.position.y = 2.2;
    group.add(head);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x8b0000 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eye.position.set(0, 2.3, 0.45);
    group.add(eye);

    group.traverse(obj => {
        if(obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });
    return group;
}

// CharacterController Class
class CharacterController {
    constructor(name, model, isPlayer = false) {
        this.name = name;
        this.model = model;
        this.isPlayer = isPlayer;
        scene.add(this.model);

        this.speed = 8;
        this.turnSpeed = 10;
        this.velocity = new THREE.Vector3();
        this.input = new THREE.Vector3();

        this.state = 'idle';
        this.attackCooldown = 0;
        this.skillCooldowns = [0, 0, 0];
        this.maxSkillCooldowns = [5, 8, 10];
        this.attackDuration = 0.4;
        this.health = 1000;
        this.maxHealth = 1000;

        // A1K Follower Logic parameters
        this.followTarget = null;
        this.followStopDist = 5;
        this.followStartDist = 6;

        // Character ID mapping (for CombatEngine)
        this.characterId = name === 'A1' ? 'A1' : (name === 'Missy' ? 'MISSY' : 'UNIQUE');

        // Dodge system
        this.dodgeState = 'ready';
        this.dodgeCooldown = 0;
        this.dodgeCooldownMax = 2.0;
        this.dodgeDuration = 0.3;
        this.dodgeSpeed = 20;
        this.invulnerable = false;
        this.lastInputTime = { w: 0, a: 0, s: 0, d: 0 };
        this.inputDoubleTapWindow = 300;

        // Jump system
        this.jumpVelocity = 0;
        this.isGrounded = true;
        this.baseGroundLevel = 0.6;
        this.currentPlatform = null;
        this.gravity = -25;
        this.jumpPower = 12;

        // Shield system
        this.shieldActive = false;
        this.shieldCooldown = 0;
        this.shieldCooldownMax = 5.0;
        this.shieldDuration = 3.0;
        this.shieldDamageReduction = 0.5;
        this.shieldVisual = null;
    }

    update(dt) {
        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        for(let i=0; i<3; i++) {
            if (this.skillCooldowns[i] > 0) this.skillCooldowns[i] -= dt;
        }

        // Dodge cooldown
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= dt;
            if (this.dodgeCooldown <= 0) {
                this.dodgeState = 'ready';
                this.invulnerable = false;
            }
        }

        // Shield cooldown and duration
        if (this.shieldCooldown > 0) {
            this.shieldCooldown -= dt;
        }

        if (this.shieldActive) {
            this.shieldDuration -= dt;
            if (this.shieldDuration <= 0) {
                this.deactivateShield();
            }
        }

        if (this.state === 'attack' && this.attackCooldown < 0) {
            this.state = 'idle';
        }

        // Handle dodge state
        if (this.dodgeState === 'dodging') {
            this.dodgeDuration -= dt;
            if (this.dodgeDuration <= 0) {
                this.dodgeState = 'cooldown';
                this.dodgeCooldown = this.dodgeCooldownMax;
                this.invulnerable = false;
                this.state = 'idle';
            }
        }

        if (this.isPlayer) {
            this.handlePlayerMovement(dt);
        } else if (this.followTarget) {
            this.handleFollowerMovement(dt);
        }

        // Apply movement
        this.model.position.add(this.velocity.clone().multiplyScalar(dt));

        // Move with platform delta if standing on moving platform
        if (this.currentPlatform && this.currentPlatform.userData && this.currentPlatform.userData.lastDelta && this.isGrounded) {
            this.model.position.add(this.currentPlatform.userData.lastDelta);
        }

        // Determine current ground (platforms override base ground)
        let groundData = null;
        if (window.PlatformSystem && typeof window.PlatformSystem.getSurfaceData === 'function') {
            groundData = window.PlatformSystem.getSurfaceData(this.model.position);
        }
        const groundLevel = groundData ? groundData.height : this.baseGroundLevel;
        this.currentPlatform = groundData ? groundData.platform : null;

        // Handle jump and gravity
        if (!this.isGrounded) {
            this.jumpVelocity += this.gravity * dt;
            this.model.position.y += this.jumpVelocity * dt;

            // Ground collision
            if (this.model.position.y <= groundLevel) {
                this.model.position.y = groundLevel;
                this.jumpVelocity = 0;
                this.isGrounded = true;
            }
        } else {
            // Keep on ground
            this.model.position.y = groundLevel;
        }

        // Bobbing animation for idle/walk
        if ((this.state === 'running' || this.state === 'idle') && this.dodgeState !== 'dodging' && this.isGrounded) {
            const bobSpeed = this.state === 'running' ? 10 : 3;
            const bobAmount = this.state === 'running' ? 0.08 : 0.03;
            this.model.position.y += Math.sin(clock.getElapsedTime() * bobSpeed) * bobAmount;
        }
    }

    jump() {
        if (!this.isGrounded) return false;
        this.isGrounded = false;
        this.jumpVelocity = this.jumpPower;
        this.state = 'jumping';
        return true;
    }

    activateShield() {
        if (this.shieldCooldown > 0 || this.shieldActive) return false;

        this.shieldActive = true;
        this.shieldDuration = 3.0;
        this.shieldCooldown = this.shieldCooldownMax;

        // Visual feedback - shield glow
        if (this.model && window.Game && window.Game.scene) {
            const shieldMesh = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x64c8ff,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                })
            );
            shieldMesh.position.copy(this.model.position);
            shieldMesh.position.y = 1;
            window.Game.scene.add(shieldMesh);
            this.shieldVisual = shieldMesh;

            // Animate shield
            let scale = 1;
            const shieldAnim = () => {
                if (!this.shieldActive) {
                    window.Game.scene.remove(shieldMesh);
                    return;
                }
                scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
                shieldMesh.scale.setScalar(scale);
                shieldMesh.position.copy(this.model.position);
                shieldMesh.position.y = 1;
                requestAnimationFrame(shieldAnim);
            };
            shieldAnim();
        }

        return true;
    }

    deactivateShield() {
        this.shieldActive = false;
        this.shieldDuration = 0;
        if (this.shieldVisual && window.Game && window.Game.scene) {
            window.Game.scene.remove(this.shieldVisual);
            this.shieldVisual = null;
        }
    }

    dodge(direction) {
        if (this.dodgeState !== 'ready') return false;

        this.dodgeState = 'dodging';
        this.dodgeDuration = 0.3;
        this.invulnerable = true;
        this.state = 'dodging';

        const dashSpeed = this.dodgeSpeed;
        this.velocity.x = direction.x * dashSpeed;
        this.velocity.z = direction.z * dashSpeed;

        // Visual trail effect
        if (this.model && window.Game && window.Game.scene) {
            const trail = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 1, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            trail.position.copy(this.model.position);
            trail.position.y = 0.5;
            window.Game.scene.add(trail);

            let life = 0.3;
            const anim = () => {
                life -= 0.02;
                trail.material.opacity = life;
                trail.scale.y = Math.max(0.1, trail.scale.y - 0.1);
                if (life > 0) {
                    requestAnimationFrame(anim);
                } else {
                    window.Game.scene.remove(trail);
                }
            };
            anim();
        }

        return true;
    }

    handlePlayerMovement(dt) {
        const moveDirection = new THREE.Vector3();

        // Get camera direction
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3().crossVectors(camera.up, forward);

        moveDirection.add(forward.multiplyScalar(this.input.z));
        moveDirection.add(right.multiplyScalar(this.input.x));
        moveDirection.normalize();

        this.velocity.x = moveDirection.x * this.speed;
        this.velocity.z = moveDirection.z * this.speed;

        if (moveDirection.lengthSq() > 0.1) {
            this.state = 'running';
            const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(this.model.position, this.model.position.clone().add(moveDirection), this.model.up)
            );
            this.model.quaternion.slerp(targetQuaternion, this.turnSpeed * dt);
        } else {
            this.state = 'idle';
        }
    }

    handleFollowerMovement(dt) {
        const distVec = this.followTarget.model.position.clone().sub(this.model.position);
        const dist = distVec.length();

        if (dist > this.followStartDist) {
            this.state = 'running';
            const moveDirection = distVec.normalize();
            this.velocity.x = moveDirection.x * this.speed * 0.9;
            this.velocity.z = moveDirection.z * this.speed * 0.9;

            const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(this.model.position, this.model.position.clone().add(moveDirection), this.model.up)
            );
            this.model.quaternion.slerp(targetQuaternion, this.turnSpeed * dt);
        } else if (dist < this.followStopDist) {
            this.state = 'idle';
            this.velocity.set(0, 0, 0);
        } else {
            this.state = 'running';
            const moveDirection = distVec.normalize();
            const speedFactor = (dist - this.followStopDist) / (this.followStartDist - this.followStopDist);
            this.velocity.x = moveDirection.x * this.speed * 0.9 * speedFactor;
            this.velocity.z = moveDirection.z * this.speed * 0.9 * speedFactor;

            const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(this.model.position, this.model.position.clone().add(moveDirection), this.model.up)
            );
            this.model.quaternion.slerp(targetQuaternion, this.turnSpeed * dt);
        }
    }

    attack() {
        if (!window.combatEngine) return;
        if (this.attackCooldown > 0) return;
        this.state = 'attack';
        this.attackCooldown = this.attackDuration;

        // Enable parry window during attack
        if (this.isPlayer && typeof window.enableParryWindow === 'function') {
            window.enableParryWindow(this.attackDuration);
        }

        // Use CombatEngine3D for basic attack
        const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(this.model.position) : null;
        const sourcePos = this.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        let targetPos;

        if (nearestEnemy) {
            targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
        } else {
            const forward = new THREE.Vector3();
            this.model.getWorldDirection(forward);
            targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
        }

        // Set active character for combat engine
        const prevActive = window.combatEngine.activeCharacter;
        window.combatEngine.activeCharacter = this.characterId;
        window.combatEngine.basicAttack(sourcePos, targetPos);
        window.combatEngine.activeCharacter = prevActive;

        // Visual animation for A1 sword
        if (this.name === 'A1' && this.model.userData.sword) {
            const sword = this.model.userData.sword;
            const startRot = sword.rotation.z;
            const targetRot = Math.PI / 2;
            let elapsed = 0;
            const anim = () => {
                elapsed += clock.getDelta() * 5;
                const t = Math.sin(elapsed * Math.PI);
                sword.rotation.z = THREE.MathUtils.lerp(startRot, targetRot, t);
                if (elapsed < 1) requestAnimationFrame(anim);
                else sword.rotation.z = startRot;
            };
            anim();
        }
    }

    useSkill(skillNum) {
        if (!window.combatEngine) return;

        const equippedSkills = window.getEquippedSkills ? window.getEquippedSkills(this.characterId) : [];
        if (skillNum < 1 || skillNum > equippedSkills.length) return;

        const skill = equippedSkills[skillNum - 1];
        if (!skill) return;

        const cdInfo = window.combatEngine.getSkillCooldown(skill.id);
        if (!cdInfo.isReady) return;

        const prevActive = window.combatEngine.activeCharacter;
        window.combatEngine.activeCharacter = this.characterId;

        const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(this.model.position) : null;
        const sourcePos = this.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        let targetPos;

        if (nearestEnemy) {
            targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
        } else {
            const forward = new THREE.Vector3();
            this.model.getWorldDirection(forward);
            targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
        }

        window.combatEngine.activateSkill(skill.id, sourcePos, targetPos);
        window.combatEngine.activeCharacter = prevActive;

        this.skillCooldowns[skillNum-1] = skill.cooldown;
    }

    startChargeSkill(skillNum) {
        if (!window.combatEngine) return;

        const equippedSkills = window.getEquippedSkills ? window.getEquippedSkills(this.characterId) : [];
        if (skillNum < 1 || skillNum > equippedSkills.length) return;

        const skill = equippedSkills[skillNum - 1];
        if (!skill || !skill.chargeable) return;

        window.combatEngine.activeCharacter = this.characterId;
        window.combatEngine.startChargeSkill(skill.id);
    }

    releaseChargeSkill(skillNum) {
        if (!window.combatEngine) return;

        const equippedSkills = window.getEquippedSkills ? window.getEquippedSkills(this.characterId) : [];
        if (skillNum < 1 || skillNum > equippedSkills.length) return;

        const skill = equippedSkills[skillNum - 1];
        if (!skill || !skill.chargeable) return;

        const prevActive = window.combatEngine.activeCharacter;
        window.combatEngine.activeCharacter = this.characterId;

        const nearestEnemy = window.findNearestEnemy ? window.findNearestEnemy(this.model.position) : null;
        const sourcePos = this.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        let targetPos;

        if (nearestEnemy) {
            targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
        } else {
            const forward = new THREE.Vector3();
            this.model.getWorldDirection(forward);
            targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
        }

        window.combatEngine.activateSkill(skill.id, sourcePos, targetPos);
        window.combatEngine.activeCharacter = prevActive;
    }
}

// Enemy Class
class Enemy {
    constructor(position) {
        this.model = createEnemy();
        this.model.position.copy(position);
        scene.add(this.model);

        this.health = 100;
        this.maxHealth = 100;
        this.speed = 5;
        this.aggroRange = 30;
        this.attackRange = 2.5;
        this.attackCooldown = 0;
        this.attackRate = 2;
        this.damage = 10;
        this.state = 'idle';

        this.boundingBox = new THREE.Box3().setFromObject(this.model);

        this.healthBar = this.createHealthBar();
        scene.add(this.healthBar);
    }

    createHealthBar() {
        const barGroup = new THREE.Group();
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const fgMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b });

        const bgBar = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), bgMat);
        const fgBar = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.15), fgMat);
        fgBar.position.z = 0.01;
        barGroup.add(bgBar, fgBar);
        barGroup.userData.fg = fgBar;
        return barGroup;
    }

    update(dt, target) {
        if (this.health <= 0) return;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const distToTarget = this.model.position.distanceTo(target.model.position);

        if (distToTarget < this.attackRange) {
            this.state = 'attack';
            if (this.attackCooldown <= 0) {
                // Attack logic - check for parry first
                if (target.isPlayer && typeof window.checkPlayerParry === 'function') {
                    const parried = window.checkPlayerParry(this.damage, this);
                    if (parried) {
                        this.attackCooldown = this.attackRate;
                        return;
                    }
                }

                // Normal attack - check for invulnerability (dodge)
                if (target.invulnerable) {
                    this.attackCooldown = this.attackRate;
                    return;
                }

                // Damage player (check for shield)
                if (target.health !== undefined) {
                    let damage = this.damage;
                    if (target.shieldActive) {
                        damage = Math.floor(damage * (1 - target.shieldDamageReduction));
                    }
                    target.health = Math.max(0, (target.health || 1000) - damage);
                }
                console.log("Enemy attacks!");
                this.attackCooldown = this.attackRate;
            }
        } else if (distToTarget < this.aggroRange) {
            this.state = 'chase';
            const direction = target.model.position.clone().sub(this.model.position).normalize();
            this.model.position.add(direction.multiplyScalar(this.speed * dt));
            this.model.lookAt(target.model.position);
        } else {
            this.state = 'idle';
        }

        this.boundingBox.setFromObject(this.model);
        this.updateHealthBar();
    }

    updateHealthBar() {
        const pct = this.health / this.maxHealth;
        this.healthBar.userData.fg.scale.x = pct;
        this.healthBar.userData.fg.position.x = - (1.5 * (1-pct)) / 2;
        this.healthBar.position.copy(this.model.position).add(new THREE.Vector3(0, 3, 0));
        this.healthBar.quaternion.copy(camera.quaternion);
    }

    takeDamage(amount, source = null) {
        if (this.health <= 0) return;
        this.health -= amount;

        if (window.ParticleSystem && window.particleSystems) {
            const ps = new window.ParticleSystem(this.model.position.clone().add(new THREE.Vector3(0,1,0)), 0xffa500);
            window.particleSystems.push(ps);
            ps.emit(20);
        }

        // Trigger combat event for combo/rage building
        if (window.combatEvents) {
            window.combatEvents.dispatchEvent(new CustomEvent('damageDealt', {
                detail: { enemy: this, damage: amount, element: 'PHYSICAL' }
            }));
        }

        // Track limit break damage
        if (typeof window.trackLimitBreakDamage === 'function') {
            window.trackLimitBreakDamage(amount);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        console.log("Enemy defeated!");
        scene.remove(this.model);
        scene.remove(this.healthBar);
        this.isDead = true;
    }
}

// Night Stalker Enemy (spawns only at night)
class NightStalker extends Enemy {
    constructor(position) {
        super(position);
        // Make it visually distinct - darker color
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.setHex(0x1a1a2e);
                child.material.emissive.setHex(0x8b0000);
                child.material.emissiveIntensity = 0.3;
            }
        });
        this.enemyType = 'nightStalker';
        this.health = 150;
        this.maxHealth = 150;
        this.speed = 7;
        this.damage = 15;
    }
}

// ══════════════════════════════════════════════════════════════════════════
// TIME SYSTEM (Phase 17: Day/Night Cycle)
// ══════════════════════════════════════════════════════════════════════════
window.TimeSystem = {
    gameTime: 12.0, // 0-24 hours (12 = noon)
    timeAcceleration: 60.0, // 1 real minute = 1 game hour
    nightStalkers: [], // Track spawned night stalkers
    lastTimeCheck: 0,

    init: () => {
        if (!window.gameState.gameTime) window.gameState.gameTime = 12.0;
        window.TimeSystem.gameTime = window.gameState.gameTime;
        window.TimeSystem.setupLighting();
        window.TimeSystem.createClockUI();
        console.log('[TimeSystem] Initialized');
    },

    setupLighting: () => {
        // Store light references
        if (!window.Game.lights) window.Game.lights = {};
        window.Game.lights.ambient = scene.children.find(c => c instanceof THREE.AmbientLight);
        window.Game.lights.directional = scene.children.find(c => c instanceof THREE.DirectionalLight);
    },

    update: (dt) => {
        window.TimeSystem.gameTime += (dt * window.TimeSystem.timeAcceleration) / 3600; // Convert to hours
        if (window.TimeSystem.gameTime >= 24) window.TimeSystem.gameTime -= 24;

        window.gameState.gameTime = window.TimeSystem.gameTime;
        window.TimeSystem.updateLighting();
        window.TimeSystem.updateClockUI();

        // Check time events every 0.5 seconds
        window.TimeSystem.lastTimeCheck += dt;
        if (window.TimeSystem.lastTimeCheck >= 0.5) {
            window.TimeSystem.checkTimeEvents();
            window.TimeSystem.lastTimeCheck = 0;
        }
    },

    updateLighting: () => {
        const time = window.TimeSystem.gameTime;

        // Rotate the sun (DirectionalLight) based on time
        // 0:00 = midnight (sun below horizon), 12:00 = noon (sun at top)
        if (window.Game.lights && window.Game.lights.directional) {
            const sunAngle = (time / 24) * Math.PI * 2 - Math.PI / 2;
            const sunDistance = 100;
            window.Game.lights.directional.position.set(
                Math.cos(sunAngle) * sunDistance,
                Math.max(0, Math.sin(sunAngle) * sunDistance), // Don't go below horizon
                0
            );

            // Adjust sun color based on time
            if (time >= 6 && time < 8) {
                // Dawn - orange
                window.Game.lights.directional.color.setHex(0xffaa44);
            } else if (time >= 8 && time < 18) {
                // Day - white
                window.Game.lights.directional.color.setHex(0xffffff);
            } else if (time >= 18 && time < 20) {
                // Dusk - orange
                window.Game.lights.directional.color.setHex(0xff8844);
            } else {
                // Night - blue (moonlight)
                window.Game.lights.directional.color.setHex(0x4444aa);
            }
        }

        // Change scene background color
        if (scene.background) {
            if (time >= 6 && time < 8) {
                // Dawn - light orange
                scene.background.setHex(0xffd4aa);
            } else if (time >= 8 && time < 18) {
                // Day - blue sky
                scene.background.setHex(0x87ceeb);
            } else if (time >= 18 && time < 20) {
                // Dusk - orange
                scene.background.setHex(0xff8844);
            } else {
                // Night - dark blue/black
                scene.background.setHex(0x001122);
            }
        }

        // Adjust AmbientLight intensity
        if (window.Game.lights && window.Game.lights.ambient) {
            if (time >= 6 && time < 8) {
                // Dawn - gradually brightening
                window.Game.lights.ambient.intensity = 0.4 + (time - 6) * 0.2;
            } else if (time >= 8 && time < 18) {
                // Day - bright
                window.Game.lights.ambient.intensity = 0.8;
            } else if (time >= 18 && time < 20) {
                // Dusk - gradually darkening
                window.Game.lights.ambient.intensity = 0.8 - (time - 18) * 0.3;
            } else {
                // Night - dark
                window.Game.lights.ambient.intensity = 0.2;
            }
        }
    },

    checkTimeEvents: () => {
        const time = window.TimeSystem.gameTime;
        const isNight = (time >= 20.0 || time < 5.0);

        // Spawn Night Stalkers only at night (20:00 - 05:00)
        if (isNight) {
            // Spawn 1-2 Night Stalkers every 10 seconds if we have less than 3
            const currentStalkers = window.TimeSystem.nightStalkers.filter(e => !e.isDead);
            if (currentStalkers.length < 3 && Math.random() < 0.1) {
                const player = window.party && window.party[0];
                if (player && player.model) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 30 + Math.random() * 20;
                    const spawnPos = new THREE.Vector3(
                        player.model.position.x + Math.cos(angle) * distance,
                        0.6,
                        player.model.position.z + Math.sin(angle) * distance
                    );

                    const stalker = new NightStalker(spawnPos);
                    window.enemies.push(stalker);
                    window.TimeSystem.nightStalkers.push(stalker);

                    if (window.createFloater) {
                        window.createFloater("NIGHT STALKER!", spawnPos, "#8b0000");
                    }
                }
            }
        } else {
            // Despawn Night Stalkers during day
            window.TimeSystem.nightStalkers.forEach(stalker => {
                if (!stalker.isDead && stalker.model) {
                    stalker.die();
                }
            });
            window.TimeSystem.nightStalkers = [];
        }

        // Despawn civilians at night
        if (isNight && window.civilians) {
            window.civilians.forEach(civilian => {
                if (civilian && civilian.model && window.Game && window.Game.scene) {
                    window.Game.scene.remove(civilian.model);
                }
            });
            window.civilians = [];
        }
    },

    createClockUI: () => {
        // Check if clock already exists
        if (document.getElementById('time-clock')) return;

        const clock = document.createElement('div');
        clock.id = 'time-clock';
        clock.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #4ECDC4;
            padding: 10px 15px;
            border-radius: 8px;
            border: 2px solid #4ECDC4;
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
        `;
        clock.innerHTML = '<div id="time-display">12:00 PM</div><div id="time-phase" style="font-size: 11px; color: #aaa;">DAY</div>';
        document.body.appendChild(clock);
    },

    updateClockUI: () => {
        const display = document.getElementById('time-display');
        const phase = document.getElementById('time-phase');
        if (!display || !phase) return;

        const hours = Math.floor(window.TimeSystem.gameTime);
        const minutes = Math.floor((window.TimeSystem.gameTime - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;

        display.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

        const time = window.TimeSystem.gameTime;
        let phaseText = 'DAY';
        if (time >= 6 && time < 8) phaseText = 'DAWN';
        else if (time >= 8 && time < 18) phaseText = 'DAY';
        else if (time >= 18 && time < 20) phaseText = 'DUSK';
        else phaseText = 'NIGHT';

        phase.textContent = phaseText;
    }
};

// Projectile Class (Legacy)
class Projectile {
    constructor(startPos, targetPos, color) {
        this.geometry = new THREE.SphereGeometry(0.15, 8, 8);
        this.material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(startPos);
        scene.add(this.mesh);

        const light = new THREE.PointLight(color, 2, 5);
        this.mesh.add(light);

        this.velocity = targetPos.clone().sub(startPos).normalize().multiplyScalar(40);
        this.lifespan = 3;
        this.damage = 15;
    }

    update(dt) {
        this.lifespan -= dt;
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));

        // Collision check
        if (window.enemies) {
            for (const enemy of window.enemies) {
                if (this.mesh.position.distanceTo(enemy.model.position) < 1.5) {
                    enemy.takeDamage(this.damage);
                    this.lifespan = 0;
                    break;
                }
            }
        }
    }
}

// ParticleSystem Class
class ParticleSystem {
    constructor(position, color) {
        this.position = position;
        this.color = new THREE.Color(color);
        this.particles = [];
        this.life = 1.5;
    }

    emit(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                position: this.position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random()) * 5,
                    (Math.random() - 0.5) * 5
                ),
                life: Math.random() * 1.0 + 0.5
            });
        }
        this.createGeometry();
    }

    createGeometry() {
        const positions = [];
        this.particles.forEach(p => positions.push(p.position.x, p.position.y, p.position.z));
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: this.color, size: 0.1, transparent: true });
        this.points = new THREE.Points(geometry, material);
        if (window.Game && window.Game.scene) {
            window.Game.scene.add(this.points);
        }
    }

    update(dt) {
        this.life -= dt;
        let aliveParticles = 0;
        const positions = this.points.geometry.attributes.position.array;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life > 0) {
                p.velocity.y -= 9.8 * dt;
                p.position.add(p.velocity.clone().multiplyScalar(dt));
                positions[i * 3] = p.position.x;
                positions[i * 3 + 1] = p.position.y;
                positions[i * 3 + 2] = p.position.z;
                aliveParticles++;
            } else {
                positions[i * 3 + 1] = -1000;
            }
        }
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.material.opacity = Math.max(0, this.life / 1.5);

        if (this.life <= 0) {
            if (window.Game && window.Game.scene) {
                window.Game.scene.remove(this.points);
            }
            this.points.geometry.dispose();
            this.points.material.dispose();
        }
    }
}

// Game Initialization
function init() {
    if (typeof window.createWorld === 'function') {
        window.createWorld();
    }

    // Initialize City Integrity System
    if (typeof window.CityIntegritySystem !== 'undefined' && window.CityIntegritySystem.init) {
        window.CityIntegritySystem.init();
    }

    // Initialize CombatEngine3D
    combatEngine = new window.CombatEngine3D(scene);
    combatEngine.activeCharacter = 'A1';

    // Initialize Time System (Phase 17)
    if (window.TimeSystem && typeof window.TimeSystem.init === 'function') {
        window.TimeSystem.init();
    }

    // Initialize gameState (must be before BagSystem loads)
    if (!window.gameState) {
        window.gameState = {
            xp: 0,
            sourceMarks: 0,
            exobits: 0,
            gold: 0,
            level: 1,
            playerLevel: 1,
            currentCharacter: 'A1',
            inventory: {
                items: [],
                gear: [],
                pets: [],
                vehicles: [],
                materials: []
            },
            equipment: {
                weapon: null,
                armor: null,
                accessory1: null,
                accessory2: null
            },
            pets: [],
            activePets: [],
            missions: {
                available: [],
                active: null,
                completed: [],
                progress: {}
            },
            dungeons: {
                currentDungeon: null,
                currentRoom: null
            },
            combat: {
                rage: 0,
                combo: 0,
                activeCharacter: 'A1'
            },
            skills: {
                equipped: {},
                mastery: {}
            }
        };
    }

    const a1 = new CharacterController('A1', createA1(), true);
    a1.model.position.set(0, 0, 5);

    const missy = new CharacterController('Missy', createMissy());
    missy.model.position.set(-2, 0, 3);
    missy.followTarget = a1;

    const unique = new CharacterController('Unique', createUnique());
    unique.model.position.set(2, 0, 3);
    unique.followTarget = a1;

    party.push(a1, missy, unique);

    for (let i = 0; i < 5; i++) {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 80,
            0,
            (Math.random() - 0.5) * 80
        );
        enemies.push(new Enemy(position));
    }

    // Initialize equipped skills mapping
    window.equippedSkills = {
        A1: ['A1_S1', 'A1_S2', 'A1_S3'],
        MISSY: ['MISSY_S1', 'MISSY_S2', 'MISSY_S3'],
        UNIQUE: ['UNIQUE_S1', 'UNIQUE_S2', 'UNIQUE_S3']
    };

    // Initialize BagSystem after game state is ready
    if (window.BagSystem && typeof window.BagSystem.init === 'function') {
        window.BagSystem.init().then(() => {
            console.log('Bag System initialized');
        }).catch(err => {
            console.warn('Bag System initialization failed:', err);
        });
    }
}

// Helper Functions
function findNearestEnemy(fromPosition) {
    let nearest = null;
    let minDistance = Infinity;
    if (window.enemies) {
        for (const enemy of window.enemies) {
            const distance = fromPosition.distanceTo(enemy.model.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        }
    }
    return nearest;
}

function performPartyAttack() {
    // Legacy function - now handled by CombatEngine via button/keyboard handlers
    if (window.combatEngine && party[0]) {
        const player = party[0];
        const nearestEnemy = findNearestEnemy(player.model.position);
        const sourcePos = player.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        let targetPos;

        if (nearestEnemy) {
            targetPos = nearestEnemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
        } else {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            targetPos = sourcePos.clone().add(forward.multiplyScalar(10));
        }

        window.combatEngine.activeCharacter = player.characterId;
        window.combatEngine.basicAttack(sourcePos, targetPos);
        player.attack();
    }
}

// Main Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Respect pause state (hit stop effect)
    if (window.Game.paused) {
        if (renderer) {
            renderer.render(scene, camera);
        }
        return;
    }

    const dt = clock.getDelta();

    // Handle input (from game-ui.js)
    if (typeof window.handleInput === 'function') {
        window.handleInput();
    }

    // Update party
    party.forEach(member => member.update(dt));

    // Update enemies
    const player = party[0];
    if (player) {
        enemies.forEach(enemy => enemy.update(dt, player));
    }

    // Update projectiles (legacy)
    projectiles.forEach(p => p.update(dt));

    // Update particle systems
    particleSystems.forEach(ps => ps.update(dt));

    // Update CombatEngine
    if (combatEngine) {
        combatEngine.update(dt, enemies);
    }

    // Update Status System (Phase 18)
    if (window.StatusSystem && typeof window.StatusSystem.update === 'function') {
        window.StatusSystem.update(dt);
    }

    // Update Time System (Phase 17)
    if (window.TimeSystem && typeof window.TimeSystem.update === 'function') {
        window.TimeSystem.update(dt);
    }

    // Update Limit Break Meter
    if (typeof window.updateLimitBreakMeter === 'function') {
        window.updateLimitBreakMeter(dt);
    }

    // Update Platform System (for moving platforms)
    if (window.PlatformSystem && typeof window.PlatformSystem.update === 'function') {
        window.PlatformSystem.update(dt);
    }

    if (window.TreeHouseSystem && typeof window.TreeHouseSystem.update === 'function') {
        window.TreeHouseSystem.update(dt);
    }

    if (window.ChestSystem && typeof window.ChestSystem.update === 'function') {
        window.ChestSystem.update(dt);
    }

    // Update Auto Attack
    if (typeof window.updateAutoAttack === 'function') {
        window.updateAutoAttack(dt);
    }

    // Update Clones
    if (typeof window.updateClones === 'function') {
        window.updateClones(dt);
    }

    // Update Loot (Physical drops)
    if (player && typeof window.updateLoot === 'function') {
        window.updateLoot(dt, player.model.position);
    }

    // Update Environment System
    if (window.EnvSystem && typeof window.EnvSystem.update === 'function') {
        window.EnvSystem.update(dt);
    }

    // Update City Integrity System
    if (typeof window.CityIntegritySystem !== 'undefined' && window.CityIntegritySystem.updateUI) {
        window.CityIntegritySystem.updateUI();
    }

    // Cleanup dead things
    enemies = enemies.filter(e => !e.isDead);
    projectiles = projectiles.filter(p => {
        if (p.lifespan <= 0) scene.remove(p.mesh);
        return p.lifespan > 0;
    });
    particleSystems = particleSystems.filter(ps => ps.life > 0);

    // Update camera to follow player
    if (player) {
        const offset = new THREE.Vector3(0, 8, 12);
        const targetPos = player.model.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(player.model.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }

    // Update UI displays (from game-ui.js)
    if (typeof window.updateUI === 'function') {
        window.updateUI();
    }

    // Only render if WebGL context was successfully created
    if (renderer) {
        renderer.render(scene, camera);
    }
}

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Switch Leader Function - Cycles through party members
function switchLeader() {
    if (!window.party || window.party.length < 2) {
        console.warn("Not enough party members to switch");
        return;
    }

    // Move first member to end
    const oldLeader = window.party.shift();
    window.party.push(oldLeader);

    // Update combat engine active character
    if (window.combatEngine && window.party[0]) {
        window.combatEngine.activeCharacter = window.party[0].characterId;
    }

    // Visual feedback
    if (window.party[0] && window.party[0].model && window.createFloater) {
        window.createFloater(`Leader: ${window.party[0].name || window.party[0].characterId}`, window.party[0].model.position, "#00ff00");
    }
}

// Export to window for global access
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.clock = clock;
window.party = party;
window.enemies = enemies;
window.projectiles = projectiles;
window.particleSystems = particleSystems;
window.combatEngine = combatEngine;
window.CharacterController = CharacterController;
window.Enemy = Enemy;
window.Projectile = Projectile;
window.ParticleSystem = ParticleSystem;
window.createA1 = createA1;
window.createMissy = createMissy;
window.createUnique = createUnique;
window.createEnemy = createEnemy;
window.NightStalker = NightStalker;
window.init = init;
window.animate = animate;
window.findNearestEnemy = findNearestEnemy;
window.performPartyAttack = performPartyAttack;
window.switchLeader = switchLeader;

// Start the game
init();
animate();
