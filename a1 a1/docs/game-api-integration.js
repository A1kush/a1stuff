/**
 * A1K Runner - Game API Integration
 * This file provides the hooks and integration points for the UI patch
 * to work with the actual game mechanics.
 */

// === GAME INTEGRATION HOOKS ===
window.Game = window.Game || {};

// Pet Management API
window.Game.spawnPet = function ({ hp = 200, type = "companion" } = {}) {
  console.log(`🐾 Game.spawnPet called: hp=${hp}, type=${type}`);

  // This is where you'd integrate with your actual pet spawning logic
  // For now, we'll create a mock pet that follows the player

  const pet = {
    id: "pet_" + Date.now(),
    hp,
    maxHP: hp,
    type,
    x: (window.playerX || 400) + Math.random() * 100 - 50,
    y: (window.playerY || 300) + Math.random() * 100 - 50,
    following: true,
    attackDamage: 25 + Math.random() * 15,

    // Add to game entities if system exists
    addToGame: function () {
      if (window.gameEntities) {
        window.gameEntities.push(this);
      }
      if (window.PartyManager) {
        window.PartyManager.addPet(this);
      }
    },
  };

  pet.addToGame();
  return pet;
};

// Vehicle Management API
window.Game.spawnVehicle = function ({ type = "speeder" } = {}) {
  console.log(`🚗 Game.spawnVehicle called: type=${type}`);

  const vehicle = {
    id: "vehicle_" + Date.now(),
    type,
    fuel: 100,
    maxFuel: 100,
    speed: 1.5,
    isBoarded: false,

    board: function () {
      if (this.fuel <= 0) return false;
      this.isBoarded = true;

      // Apply speed boost to player if system exists
      if (window.Player && window.Player.applySpeedMultiplier) {
        window.Player.applySpeedMultiplier(this.speed);
      }

      return true;
    },

    unboard: function () {
      this.isBoarded = false;

      // Remove speed boost
      if (window.Player && window.Player.removeSpeedMultiplier) {
        window.Player.removeSpeedMultiplier();
      }
    },
  };

  return vehicle;
};

// Equipment System Hooks
window.Game.getEquippedItems = function () {
  // Return current equipment state
  // This should integrate with your actual inventory system
  return {
    weapon: null,
    armor: null,
    accessory1: null,
    accessory2: null,
    pet1: null,
    pet2: null,
    vehicle: null,
  };
};

window.Game.equipItem = function (item, slot) {
  console.log(`⚔️ Game.equipItem: ${item.name} -> ${slot}`);
  // Integrate with your equipment system

  // Fire equipment change event
  window.dispatchEvent(
    new CustomEvent("game:equipment.change", {
      detail: { item, slot },
    })
  );
};

// Enemy System Hook
window.Game.getEnemies = function () {
  // Return current enemies that pets can target
  return window.gameEnemies || [];
};

// Player Position Hook
window.Game.getPlayerPosition = function () {
  return {
    x: window.playerX || 400,
    y: window.playerY || 300,
  };
};

// Damage System Hook
window.Game.dealDamage = function (target, damage, source = "pet") {
  console.log(`💥 Dealing ${damage} damage to target from ${source}`);

  if (target && typeof target.takeDamage === "function") {
    target.takeDamage(damage);
  } else if (target && target.hp !== undefined) {
    target.hp = Math.max(0, target.hp - damage);

    // Create damage number effect
    if (window.createDamageNumber) {
      window.createDamageNumber(
        target.x,
        target.y,
        damage,
        source === "pet" ? "#36c777" : "#fff"
      );
    }
  }
};

// === EVENT LISTENERS ===
// Listen for UI events and route them to game logic
window.addEventListener("ui:summon.pet", (e) => {
  const { hp } = e.detail;
  const pet = window.Game.spawnPet({ hp });

  // Notify UI systems
  window.dispatchEvent(
    new CustomEvent("game:pet.spawned", {
      detail: { pet },
    })
  );
});

window.addEventListener("ui:summon.vehicle", (e) => {
  const vehicle = window.Game.spawnVehicle();

  // Notify UI systems
  window.dispatchEvent(
    new CustomEvent("game:vehicle.spawned", {
      detail: { vehicle },
    })
  );
});

// Listen for bag open events
window.addEventListener("ui:bag.open", (e) => {
  const { tab } = e.detail;
  console.log(`📦 Opening bag tab: ${tab}`);

  // Integrate with existing bag system
  if (window.openInventoryTab) {
    window.openInventoryTab(tab);
  } else if (window.BagManager && window.BagManager.openTab) {
    window.BagManager.openTab(tab);
  }
});

// === MOCK SYSTEMS FOR DEVELOPMENT ===
// These provide fallbacks when the actual game systems aren't available

// Mock Player System
if (!window.Player) {
  window.Player = {
    x: 400,
    y: 300,
    speed: 1,

    applySpeedMultiplier: function (multiplier) {
      this.speed *= multiplier;
      console.log(`🏃 Player speed boosted to ${this.speed}`);
    },

    removeSpeedMultiplier: function () {
      this.speed = 1;
      console.log(`🏃 Player speed reset to ${this.speed}`);
    },
  };

  // Update player position references
  window.playerX = window.Player.x;
  window.playerY = window.Player.y;
}

// Mock Enemy System
if (!window.gameEnemies) {
  window.gameEnemies = [];

  // Add some mock enemies for testing
  for (let i = 0; i < 3; i++) {
    window.gameEnemies.push({
      id: "enemy_" + i,
      x: 200 + Math.random() * 400,
      y: 200 + Math.random() * 200,
      hp: 50 + Math.random() * 100,
      maxHP: 100,

      takeDamage: function (damage) {
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) {
          this.destroy();
        }
      },

      destroy: function () {
        const index = window.gameEnemies.indexOf(this);
        if (index > -1) {
          window.gameEnemies.splice(index, 1);
        }
      },
    });
  }
}

// Mock Damage Number System
if (!window.createDamageNumber) {
  window.createDamageNumber = function (x, y, damage, color = "#fff") {
    const damageEl = document.createElement("div");
    damageEl.textContent = "-" + Math.round(damage);
    damageEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-weight: bold;
            font-size: 16px;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            animation: damageFloat 1s ease-out forwards;
        `;

    document.body.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 1000);
  };

  // Add damage float animation
  const style = document.createElement("style");
  style.textContent = `
        @keyframes damageFloat {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
        }
    `;
  document.head.appendChild(style);
}

// === INVENTORY SYSTEM INTEGRATION ===
// Hook into existing inventory system if available
window.addEventListener("inventory:filter", (e) => {
  const filters = e.detail;
  console.log("🔍 Applying inventory filters:", filters);

  // Apply filters to inventory items
  const items = document.querySelectorAll(".inv-item, .bag-item");
  items.forEach((item) => {
    let show = true;

    // Apply rarity filter
    if (filters.rarity !== "all") {
      const itemRarity = item.dataset.rarity || "common";
      show = show && itemRarity === filters.rarity;
    }

    // Apply type filter
    if (filters.type !== "all") {
      const itemType = item.dataset.type || "misc";
      show = show && itemType === filters.type;
    }

    // Apply upgrades only filter
    if (filters.upgradesOnly) {
      const isUpgrade =
        item.classList.contains("upgrade") || item.dataset.upgrade === "true";
      show = show && isUpgrade;
    }

    // Apply sets only filter
    if (filters.setsOnly) {
      const isSet =
        item.classList.contains("set") || item.dataset.set === "true";
      show = show && isSet;
    }

    item.style.display = show ? "block" : "none";
  });
});

console.log("🔧 A1K Game API Integration loaded");
