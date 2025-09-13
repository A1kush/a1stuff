/**
 * A1K Runner - UI Patch for Pet/Vehicle/Inventory System
 * Runtime patch that adds Pet and Vehicle buttons above joystick,
 * removes AP button, enhances inventory overlay, and implements
 * comprehensive pet/vehicle management system.
 *
 * Features:
 * - Pet and Vehicle buttons above joystick
 * - Enhanced inventory overlay (wider, better grid layout)
 * - Full pet management with follow AI and attack logic
 * - Vehicle system with boarding/fuel mechanics
 * - Cooldown halos for buttons
 * - Paper doll equipment system
 * - Search and filter functionality
 * - Keyboard shortcuts
 * - Analytics events
 */

(() => {
  "use strict";

  console.log("🎮 A1K UI Patch: Pet/Vehicle/Inventory System Loading...");

  // === CONFIGURATION ===
  const CONFIG = {
    pets: {
      maxActive: 3,
      followDistance: 72,
      attackRange: 96,
      defaultHP: 200,
    },
    vehicles: {
      fuelCapacity: 100,
      fuelDrainRate: 0.5,
      heatCapacity: 100,
    },
    ui: {
      cooldownDuration: 30000, // 30 seconds
      toastDuration: 3000,
      gridExpansion: "90vw",
      gridHeight: "86vh",
    },
    keybinds: {
      inventory: "KeyI",
      gear: "KeyG",
      pets: "KeyP",
      vehicles: "KeyV",
      character: "KeyC",
      escape: "Escape",
    },
  };

  // === GAME STATE ===
  const GameState = {
    pets: {
      active: [],
      bench: [],
      cooldowns: new Map(),
    },
    vehicles: {
      current: null,
      fuel: CONFIG.vehicles.fuelCapacity,
      heat: 0,
      cooldown: 0,
    },
    ui: {
      currentTab: "items",
      fullscreen: false,
      filters: {
        rarity: "all",
        type: "all",
        upgradesOnly: false,
        setsOnly: false,
      },
    },
  };

  // === UTILITY FUNCTIONS ===
  function showToast(
    message,
    type = "info",
    duration = CONFIG.ui.toastDuration
  ) {
    const toast = document.createElement("div");
    toast.className = `ui-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${
              type === "success"
                ? "#36c777"
                : type === "error"
                ? "#ff6b6b"
                : "#3ec5ff"
            };
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 15000;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function fireAnalyticsEvent(event, data = {}) {
    window.dispatchEvent(
      new CustomEvent(`analytics:${event}`, { detail: data })
    );
    console.log(`📊 Analytics: ${event}`, data);
  }

  function createCooldownHalo(button, duration) {
    const halo = document.createElement("div");
    halo.className = "cooldown-halo";
    halo.style.cssText = `
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            background: conic-gradient(from 0deg, #ff6b6b, transparent);
            z-index: -1;
            animation: cooldownSpin ${duration}ms linear;
        `;

    button.style.position = "relative";
    button.appendChild(halo);

    setTimeout(() => {
      halo.remove();
      button.style.background = "#36c777";
      button.style.boxShadow = "0 0 20px #36c777aa";
      setTimeout(() => {
        button.style.background = "";
        button.style.boxShadow = "";
      }, 2000);
    }, duration);
  }

  // === PET SYSTEM ===
  class Pet {
    constructor(type = "companion", hp = CONFIG.pets.defaultHP) {
      this.id =
        "pet_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
      this.type = type;
      this.hp = hp;
      this.maxHP = hp;
      this.x = 0;
      this.y = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.following = true;
      this.attackCooldown = 0;
      this.element = null;
      this.createVisual();
    }

    createVisual() {
      this.element = document.createElement("div");
      this.element.className = "pet-sprite";
      this.element.style.cssText = `
                position: absolute;
                width: 32px;
                height: 32px;
                background: #36c777;
                border-radius: 50%;
                z-index: 1000;
                transition: all 0.1s ease;
                border: 2px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;

      // Add to game container
      const gameContainer = document.getElementById("wrap") || document.body;
      gameContainer.appendChild(this.element);
    }

    update(playerX, playerY, enemies = []) {
      if (!this.following) return;

      // Follow AI - simple boid-like behavior
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance > CONFIG.pets.followDistance) {
        this.targetX =
          playerX - (dx / distance) * (CONFIG.pets.followDistance * 0.7);
        this.targetY =
          playerY - (dy / distance) * (CONFIG.pets.followDistance * 0.7);
      }

      // Move towards target
      const tdx = this.targetX - this.x;
      const tdy = this.targetY - this.y;
      this.x += tdx * 0.1;
      this.y += tdy * 0.1;

      // Update visual position
      if (this.element) {
        this.element.style.left = this.x + "px";
        this.element.style.top = this.y + "px";
      }

      // Attack logic
      if (this.attackCooldown <= 0 && enemies.length > 0) {
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (
          nearestEnemy &&
          this.distanceTo(nearestEnemy) <= CONFIG.pets.attackRange
        ) {
          this.attack(nearestEnemy);
          this.attackCooldown = 60; // frames
        }
      }

      if (this.attackCooldown > 0) this.attackCooldown--;
    }

    findNearestEnemy(enemies) {
      let nearest = null;
      let minDistance = CONFIG.pets.attackRange;

      enemies.forEach((enemy) => {
        const distance = this.distanceTo(enemy);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = enemy;
        }
      });

      return nearest;
    }

    distanceTo(target) {
      return Math.hypot(target.x - this.x, target.y - this.y);
    }

    attack(target) {
      // Create attack effect
      const effect = document.createElement("div");
      effect.style.cssText = `
                position: absolute;
                left: ${this.x}px;
                top: ${this.y}px;
                width: 4px;
                height: 4px;
                background: #fff;
                border-radius: 50%;
                z-index: 1001;
                animation: petAttack 0.3s ease;
            `;

      document.body.appendChild(effect);
      setTimeout(() => effect.remove(), 300);

      // Damage logic (integrate with game)
      if (typeof window.dealDamage === "function") {
        window.dealDamage(target, 25 + Math.random() * 15);
      }
    }

    destroy() {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  }

  // === VEHICLE SYSTEM ===
  class Vehicle {
    constructor(type = "speeder") {
      this.type = type;
      this.fuel = CONFIG.vehicles.fuelCapacity;
      this.heat = 0;
      this.isBoarded = false;
      this.speed = 1.5;
      this.element = null;
      this.createVisual();
    }

    createVisual() {
      this.element = document.createElement("div");
      this.element.className = "vehicle-sprite";
      this.element.style.cssText = `
                position: absolute;
                width: 48px;
                height: 24px;
                background: #3ec5ff;
                border-radius: 12px;
                z-index: 999;
                border: 2px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: none;
            `;

      const gameContainer = document.getElementById("wrap") || document.body;
      gameContainer.appendChild(this.element);
    }

    board() {
      if (this.fuel <= 0) {
        showToast("Vehicle out of fuel!", "error");
        return false;
      }

      this.isBoarded = true;
      this.element.style.display = "block";
      showToast("Vehicle boarded!", "success");
      return true;
    }

    unboard() {
      this.isBoarded = false;
      this.element.style.display = "none";
      showToast("Vehicle unboarded", "info");
    }

    update() {
      if (this.isBoarded && this.fuel > 0) {
        this.fuel -= CONFIG.vehicles.fuelDrainRate;
        if (this.fuel <= 0) {
          this.unboard();
          showToast("Vehicle ran out of fuel!", "error");
        }
      }

      // Update fuel bar
      this.updateFuelBar();
    }

    updateFuelBar() {
      let fuelBar = document.getElementById("vehicle-fuel-bar");
      if (!fuelBar) {
        fuelBar = document.createElement("div");
        fuelBar.id = "vehicle-fuel-bar";
        fuelBar.style.cssText = `
                    position: fixed;
                    left: 130px;
                    bottom: 200px;
                    width: 60px;
                    height: 4px;
                    background: #333;
                    border-radius: 2px;
                    z-index: 12001;
                `;
        document.body.appendChild(fuelBar);
      }

      const fuelPercent = (this.fuel / CONFIG.vehicles.fuelCapacity) * 100;
      fuelBar.innerHTML = `<div style="width: ${fuelPercent}%; height: 100%; background: #3ec5ff; border-radius: 2px;"></div>`;
      fuelBar.style.display = this.isBoarded ? "block" : "none";
    }

    destroy() {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
      const fuelBar = document.getElementById("vehicle-fuel-bar");
      if (fuelBar) fuelBar.remove();
    }
  }

  // === UI ENHANCEMENTS ===
  function enhanceInventoryOverlay() {
    // Find and enhance the bag overlay
    const bagOverlay =
      document.querySelector(".bag-overlay") ||
      document.querySelector("#inventory");
    if (bagOverlay) {
      bagOverlay.style.width = CONFIG.ui.gridExpansion;
      bagOverlay.style.height = CONFIG.ui.gridHeight;
      bagOverlay.style.maxWidth = CONFIG.ui.gridExpansion;
      bagOverlay.style.maxHeight = CONFIG.ui.gridHeight;
    }

    // Enhance grid layouts
    const grids = document.querySelectorAll(".bag-grid, .inv-grid");
    grids.forEach((grid) => {
      grid.style.width = "100%";
      grid.style.height = "calc(100% - 60px)";
      grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(80px, 1fr))";
      grid.style.gap = "8px";
      grid.style.padding = "12px";
    });
  }

  function addSearchAndFilters() {
    const bagOverlay =
      document.querySelector(".bag-overlay") ||
      document.querySelector("#inventory");
    if (!bagOverlay) return;

    const searchContainer = document.createElement("div");
    searchContainer.className = "bag-search-container";
    searchContainer.style.cssText = `
            padding: 12px;
            border-bottom: 1px solid var(--line);
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;

    // Search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search items...";
    searchInput.className = "bag-search-input";
    searchInput.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--line);
            border-radius: 6px;
            background: var(--panel2);
            color: var(--ink);
            min-width: 200px;
        `;

    // Filter chips
    const filterContainer = document.createElement("div");
    filterContainer.className = "filter-chips";
    filterContainer.style.cssText = `
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        `;

    const rarities = ["All", "Common", "Rare", "Epic", "Legendary"];
    rarities.forEach((rarity) => {
      const chip = document.createElement("button");
      chip.textContent = rarity;
      chip.className = "filter-chip";
      chip.style.cssText = `
                padding: 4px 8px;
                border: 1px solid var(--line);
                border-radius: 12px;
                background: var(--panel);
                color: var(--muted);
                cursor: pointer;
                font-size: 12px;
            `;

      chip.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-chip")
          .forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        GameState.ui.filters.rarity = rarity.toLowerCase();
        applyFilters();
      });

      filterContainer.appendChild(chip);
    });

    // Toggle filters
    const upgradesToggle = createToggle("Only Upgrades", () => {
      GameState.ui.filters.upgradesOnly = !GameState.ui.filters.upgradesOnly;
      applyFilters();
    });

    const setsToggle = createToggle("Only Sets", () => {
      GameState.ui.filters.setsOnly = !GameState.ui.filters.setsOnly;
      applyFilters();
    });

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(filterContainer);
    searchContainer.appendChild(upgradesToggle);
    searchContainer.appendChild(setsToggle);

    // Insert at top of bag overlay
    bagOverlay.insertBefore(searchContainer, bagOverlay.firstChild);

    // Add search functionality
    searchInput.addEventListener("input", applyFilters);
  }

  function createToggle(label, callback) {
    const toggle = document.createElement("label");
    toggle.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--muted);
            cursor: pointer;
            white-space: nowrap;
        `;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", callback);

    toggle.appendChild(checkbox);
    toggle.appendChild(document.createTextNode(label));

    return toggle;
  }

  function applyFilters() {
    // This would integrate with the actual inventory system
    // For now, just fire an event that the inventory system can listen to
    window.dispatchEvent(
      new CustomEvent("inventory:filter", {
        detail: GameState.ui.filters,
      })
    );
  }

  function addPaperDoll() {
    const characterTab =
      document.querySelector('[data-tab="character"]') ||
      document.getElementById("character-tab");

    if (!characterTab) return;

    const paperDoll = document.createElement("div");
    paperDoll.className = "paper-doll";
    paperDoll.innerHTML = `
            <div class="paper-doll-container">
                <div class="character-silhouette">
                    <div class="equipment-slot" data-slot="head" style="top: 10%; left: 40%;">Head</div>
                    <div class="equipment-slot" data-slot="chest" style="top: 30%; left: 40%;">Chest</div>
                    <div class="equipment-slot" data-slot="legs" style="top: 50%; left: 40%;">Legs</div>
                    <div class="equipment-slot" data-slot="boots" style="top: 70%; left: 40%;">Boots</div>
                    <div class="equipment-slot" data-slot="weapon" style="top: 35%; left: 10%;">Weapon</div>
                    <div class="equipment-slot" data-slot="shield" style="top: 35%; left: 70%;">Shield</div>
                    <div class="equipment-slot" data-slot="acc1" style="top: 20%; left: 70%;">Acc 1</div>
                    <div class="equipment-slot" data-slot="acc2" style="top: 50%; left: 70%;">Acc 2</div>
                </div>
            </div>
        `;

    paperDoll.style.cssText = `
            position: relative;
            width: 300px;
            height: 400px;
            margin: 20px auto;
            background: var(--panel2);
            border: 1px solid var(--line);
            border-radius: 12px;
        `;

    characterTab.appendChild(paperDoll);
  }

  // === BUTTON MANAGEMENT ===
  function updateButtons() {
    const petBtn = document.getElementById("btnSummonPet");
    const vehBtn = document.getElementById("btnCallVehicle");
    const apBtn = document.getElementById("btnAutoAP");

    // Remove AP button
    if (apBtn) {
      apBtn.remove();
    }

    // Enhance Pet button
    if (petBtn) {
      petBtn.innerHTML = `Pet<span style="font-size:10px;display:block;">${GameState.pets.active.length}/${CONFIG.pets.maxActive}</span>`;

      petBtn.onclick = () => {
        if (GameState.pets.active.length >= CONFIG.pets.maxActive) {
          showToast(`Max ${CONFIG.pets.maxActive} pets active!`, "error");
          return;
        }

        const pet = new Pet();
        GameState.pets.active.push(pet);

        // Fire custom event
        window.dispatchEvent(
          new CustomEvent("ui:summon.pet", {
            detail: { hp: CONFIG.pets.defaultHP, pet },
          })
        );

        showToast(
          `Pet summoned! (${GameState.pets.active.length}/${CONFIG.pets.maxActive})`,
          "success"
        );
        createCooldownHalo(petBtn, CONFIG.ui.cooldownDuration);
        fireAnalyticsEvent("pet.summon", {
          count: GameState.pets.active.length,
        });

        updateButtons(); // Refresh display
      };
    }

    // Enhance Vehicle button
    if (vehBtn) {
      const currentVeh = GameState.vehicles.current;
      vehBtn.innerHTML = `Veh<span style="font-size:10px;display:block;">${
        currentVeh ? (currentVeh.isBoarded ? "ON" : "OFF") : "---"
      }</span>`;

      vehBtn.onclick = () => {
        if (!GameState.vehicles.current) {
          GameState.vehicles.current = new Vehicle();
          showToast("Vehicle deployed!", "success");

          window.dispatchEvent(
            new CustomEvent("ui:summon.vehicle", {
              detail: { vehicle: GameState.vehicles.current },
            })
          );

          fireAnalyticsEvent("vehicle.deploy");
        } else {
          if (GameState.vehicles.current.isBoarded) {
            GameState.vehicles.current.unboard();
          } else {
            GameState.vehicles.current.board();
          }
        }

        createCooldownHalo(vehBtn, CONFIG.ui.cooldownDuration * 0.5);
        updateButtons();
      };
    }
  }

  // === KEYBOARD SHORTCUTS ===
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      const key = e.code;

      switch (key) {
        case CONFIG.keybinds.inventory:
          openTab("items");
          e.preventDefault();
          break;
        case CONFIG.keybinds.gear:
          openTab("gear");
          e.preventDefault();
          break;
        case CONFIG.keybinds.pets:
          openTab("pets");
          e.preventDefault();
          break;
        case CONFIG.keybinds.vehicles:
          openTab("vehicles");
          e.preventDefault();
          break;
        case CONFIG.keybinds.character:
          openTab("character");
          e.preventDefault();
          break;
        case CONFIG.keybinds.escape:
          closeBagOverlay();
          e.preventDefault();
          break;
      }
    });
  }

  function openTab(tabName) {
    // Fire event that existing UI system can handle
    window.dispatchEvent(
      new CustomEvent("ui:bag.open", {
        detail: { tab: tabName },
      })
    );

    GameState.ui.currentTab = tabName;
    fireAnalyticsEvent("ui.tab.open", { tab: tabName });

    // Try to find and click existing tab
    const tabElement =
      document.querySelector(`[data-tab="${tabName}"]`) ||
      document.querySelector(`#${tabName}-tab`);
    if (tabElement) {
      tabElement.click();
    }
  }

  function closeBagOverlay() {
    const overlay =
      document.querySelector(".bag-overlay") ||
      document.querySelector("#inventory");
    if (overlay && overlay.style.display !== "none") {
      // Try existing close mechanism first
      const closeBtn = overlay.querySelector(".close-btn, .bag-close");
      if (closeBtn) {
        closeBtn.click();
      } else {
        overlay.style.display = "none";
      }
    }
  }

  // === GAME LOOP INTEGRATION ===
  function startUpdateLoop() {
    function update() {
      // Update pets
      GameState.pets.active.forEach((pet, index) => {
        if (pet.hp <= 0) {
          pet.destroy();
          GameState.pets.active.splice(index, 1);
          updateButtons();
          return;
        }

        // Get player position (integrate with actual game)
        const playerX = window.playerX || 400;
        const playerY = window.playerY || 300;
        const enemies = window.gameEnemies || [];

        pet.update(playerX, playerY, enemies);
      });

      // Update vehicle
      if (GameState.vehicles.current) {
        GameState.vehicles.current.update();
      }

      requestAnimationFrame(update);
    }

    update();
  }

  // === TOP DOCK INTEGRATION ===
  function wireTopDockButtons() {
    // Find top dock buttons and wire them to open specific tabs
    const topButtons = document.querySelectorAll(
      ".hud-top .btn, .top-dock .btn"
    );

    topButtons.forEach((btn) => {
      const text = btn.textContent.toLowerCase();
      if (text.includes("inventory") || text.includes("bag")) {
        btn.addEventListener("click", () => openTab("items"));
      } else if (text.includes("gear")) {
        btn.addEventListener("click", () => openTab("gear"));
      } else if (text.includes("pets")) {
        btn.addEventListener("click", () => openTab("pets"));
      }
    });
  }

  // === FULLSCREEN TOGGLE ===
  function addFullscreenToggle() {
    const bagOverlay =
      document.querySelector(".bag-overlay") ||
      document.querySelector("#inventory");
    if (!bagOverlay) return;

    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.innerHTML = "⛶";
    fullscreenBtn.title = "Toggle Fullscreen Bag";
    fullscreenBtn.style.cssText = `
            position: absolute;
            top: 12px;
            right: 50px;
            width: 32px;
            height: 32px;
            border: 1px solid var(--line);
            background: var(--panel);
            color: var(--ink);
            border-radius: 6px;
            cursor: pointer;
            z-index: 100;
        `;

    fullscreenBtn.addEventListener("click", () => {
      GameState.ui.fullscreen = !GameState.ui.fullscreen;

      if (GameState.ui.fullscreen) {
        bagOverlay.style.width = "95vw";
        bagOverlay.style.height = "90vh";
        bagOverlay.style.left = "2.5vw";
        bagOverlay.style.top = "5vh";
        fullscreenBtn.innerHTML = "⛝";
        showToast("Fullscreen bag enabled", "info");
      } else {
        bagOverlay.style.width = CONFIG.ui.gridExpansion;
        bagOverlay.style.height = CONFIG.ui.gridHeight;
        bagOverlay.style.left = "";
        bagOverlay.style.top = "";
        fullscreenBtn.innerHTML = "⛶";
        showToast("Fullscreen bag disabled", "info");
      }

      fireAnalyticsEvent("ui.fullscreen.toggle", {
        enabled: GameState.ui.fullscreen,
      });
    });

    bagOverlay.appendChild(fullscreenBtn);
  }

  // === CSS ANIMATIONS ===
  function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes cooldownSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            @keyframes petAttack {
                0% { transform: scale(1); }
                50% { transform: scale(2); opacity: 0.8; }
                100% { transform: scale(0); opacity: 0; }
            }
            
            .filter-chip.active {
                background: var(--hp) !important;
                color: white !important;
                border-color: var(--hp) !important;
            }
            
            .equipment-slot {
                position: absolute;
                width: 60px;
                height: 60px;
                border: 2px dashed var(--line);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: var(--muted);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .equipment-slot:hover {
                border-color: var(--hp);
                background: rgba(54, 199, 119, 0.1);
            }
            
            .equipment-slot.equipped {
                border-style: solid;
                border-color: var(--hp);
                background: rgba(54, 199, 119, 0.2);
            }
        `;

    document.head.appendChild(style);
  }

  // === INITIALIZATION ===
  function init() {
    console.log("🎮 Initializing A1K UI Patch...");

    // Wait for DOM and existing UI to load
    setTimeout(() => {
      injectCSS();
      updateButtons();
      enhanceInventoryOverlay();
      addSearchAndFilters();
      addPaperDoll();
      setupKeyboardShortcuts();
      wireTopDockButtons();
      addFullscreenToggle();
      startUpdateLoop();

      console.log("✅ A1K UI Patch: Fully loaded!");
      showToast("🎮 A1K Enhanced UI Ready!", "success");

      // Fire ready event
      window.dispatchEvent(
        new CustomEvent("ui:patch.ready", {
          detail: { version: "2.5.0", features: Object.keys(CONFIG) },
        })
      );
    }, 1000);
  }

  // === GLOBAL API ===
  window.A1K_UI = {
    GameState,
    CONFIG,
    Pet,
    Vehicle,
    showToast,
    fireAnalyticsEvent,
    openTab,
    closeBagOverlay,
  };

  // Start initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
