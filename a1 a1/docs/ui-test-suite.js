/**
 * A1K Runner - Enhanced UI Test Suite
 * This file provides test functions and demos for all the new UI features
 * Open browser console and run these commands to test functionality
 */

window.A1K_Tests = {
  // Test Pet System
  testPets: function () {
    console.log("🧪 Testing Pet System...");

    // Test pet summoning
    const petBtn = document.getElementById("btnSummonPet");
    if (petBtn) {
      console.log("✓ Pet button found");
      petBtn.click();
      setTimeout(() => petBtn.click(), 1000); // Summon second pet
      setTimeout(() => petBtn.click(), 2000); // Summon third pet
      setTimeout(() => petBtn.click(), 3000); // Should show max pets message
    } else {
      console.log("❌ Pet button not found");
    }

    // Test keyboard shortcut
    setTimeout(() => {
      console.log("Testing P key shortcut...");
      const event = new KeyboardEvent("keydown", { code: "KeyP" });
      document.dispatchEvent(event);
    }, 4000);
  },

  // Test Vehicle System
  testVehicles: function () {
    console.log("🧪 Testing Vehicle System...");

    const vehBtn = document.getElementById("btnCallVehicle");
    if (vehBtn) {
      console.log("✓ Vehicle button found");
      vehBtn.click(); // Deploy
      setTimeout(() => vehBtn.click(), 1000); // Board
      setTimeout(() => vehBtn.click(), 3000); // Unboard
    } else {
      console.log("❌ Vehicle button not found");
    }

    // Test keyboard shortcut
    setTimeout(() => {
      console.log("Testing V key shortcut...");
      const event = new KeyboardEvent("keydown", { code: "KeyV" });
      document.dispatchEvent(event);
    }, 5000);
  },

  // Test Inventory Features
  testInventory: function () {
    console.log("🧪 Testing Enhanced Inventory...");

    // Test keyboard shortcuts
    const shortcuts = [
      { key: "KeyI", name: "Inventory" },
      { key: "KeyG", name: "Gear" },
      { key: "KeyP", name: "Pets" },
      { key: "KeyV", name: "Vehicles" },
      { key: "KeyC", name: "Character" },
    ];

    shortcuts.forEach((shortcut, index) => {
      setTimeout(() => {
        console.log(`Testing ${shortcut.name} shortcut (${shortcut.key})...`);
        const event = new KeyboardEvent("keydown", { code: shortcut.key });
        document.dispatchEvent(event);
      }, index * 1500);
    });

    // Test ESC to close
    setTimeout(() => {
      console.log("Testing ESC to close...");
      const event = new KeyboardEvent("keydown", { code: "Escape" });
      document.dispatchEvent(event);
    }, shortcuts.length * 1500 + 1000);
  },

  // Test Search and Filters
  testFilters: function () {
    console.log("🧪 Testing Search and Filters...");

    // First open inventory
    const event = new KeyboardEvent("keydown", { code: "KeyI" });
    document.dispatchEvent(event);

    setTimeout(() => {
      const searchInput = document.querySelector(".bag-search-input");
      if (searchInput) {
        console.log("✓ Search input found");
        searchInput.value = "test";
        searchInput.dispatchEvent(new Event("input"));
      } else {
        console.log("❌ Search input not found");
      }

      // Test filter chips
      const filterChips = document.querySelectorAll(".filter-chip");
      if (filterChips.length > 0) {
        console.log(`✓ Found ${filterChips.length} filter chips`);
        filterChips[1]?.click(); // Click second chip (usually "Rare")
      } else {
        console.log("❌ No filter chips found");
      }
    }, 1000);
  },

  // Test Fullscreen Mode
  testFullscreen: function () {
    console.log("🧪 Testing Fullscreen Mode...");

    // Open inventory first
    const event = new KeyboardEvent("keydown", { code: "KeyI" });
    document.dispatchEvent(event);

    setTimeout(() => {
      // Look for fullscreen toggle
      const fullscreenBtn = document.querySelector(
        'button[title="Toggle Fullscreen Bag"]'
      );
      if (fullscreenBtn) {
        console.log("✓ Fullscreen button found");
        fullscreenBtn.click();

        setTimeout(() => {
          fullscreenBtn.click(); // Toggle back
        }, 2000);
      } else {
        console.log("❌ Fullscreen button not found");
      }
    }, 1000);
  },

  // Test Analytics Events
  testAnalytics: function () {
    console.log("🧪 Testing Analytics Events...");

    // Listen for analytics events
    const events = [];
    const analyticsListener = (e) => {
      if (e.type.startsWith("analytics:")) {
        events.push({ type: e.type, detail: e.detail });
        console.log(`📊 Analytics Event: ${e.type}`, e.detail);
      }
    };

    // Add listeners for all analytics events
    [
      "analytics:pet.summon",
      "analytics:vehicle.deploy",
      "analytics:ui.tab.open",
      "analytics:ui.fullscreen.toggle",
    ].forEach((eventType) => {
      window.addEventListener(eventType, analyticsListener);
    });

    // Trigger some actions that should fire analytics
    setTimeout(() => document.getElementById("btnSummonPet")?.click(), 500);
    setTimeout(() => document.getElementById("btnCallVehicle")?.click(), 1000);
    setTimeout(
      () =>
        document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyI" })),
      1500
    );

    // Report results
    setTimeout(() => {
      console.log(`📈 Total analytics events captured: ${events.length}`);
      events.forEach((event) => console.log(`  - ${event.type}`, event.detail));
    }, 3000);
  },

  // Test Game API Integration
  testGameAPI: function () {
    console.log("🧪 Testing Game API Integration...");

    // Test Game.spawnPet
    if (typeof window.Game.spawnPet === "function") {
      console.log("✓ Game.spawnPet available");
      const pet = window.Game.spawnPet({ hp: 150, type: "test" });
      console.log("Pet spawned:", pet);
    } else {
      console.log("❌ Game.spawnPet not available");
    }

    // Test Game.spawnVehicle
    if (typeof window.Game.spawnVehicle === "function") {
      console.log("✓ Game.spawnVehicle available");
      const vehicle = window.Game.spawnVehicle({ type: "test" });
      console.log("Vehicle spawned:", vehicle);
    } else {
      console.log("❌ Game.spawnVehicle not available");
    }

    // Test Global A1K_UI API
    if (window.A1K_UI) {
      console.log("✓ A1K_UI global API available");
      console.log("Available methods:", Object.keys(window.A1K_UI));

      // Test toast system
      window.A1K_UI.showToast("Test Toast Message!", "success");

      setTimeout(() => {
        window.A1K_UI.showToast("Error Test!", "error");
      }, 1000);
    } else {
      console.log("❌ A1K_UI global API not available");
    }
  },

  // Test Visual Effects
  testVisualEffects: function () {
    console.log("🧪 Testing Visual Effects...");

    // Test cooldown halos
    const petBtn = document.getElementById("btnSummonPet");
    const vehBtn = document.getElementById("btnCallVehicle");

    if (petBtn && window.A1K_UI) {
      console.log("✓ Testing cooldown halo on pet button");
      // Create a short cooldown for testing
      const halo = document.createElement("div");
      halo.className = "cooldown-halo";
      halo.style.cssText = `
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                background: conic-gradient(from 0deg, #ff6b6b, transparent);
                z-index: -1;
                animation: cooldownSpin 3000ms linear;
            `;
      petBtn.style.position = "relative";
      petBtn.appendChild(halo);

      setTimeout(() => {
        halo.remove();
        petBtn.style.background = "#36c777";
        petBtn.style.boxShadow = "0 0 20px #36c777aa";
        setTimeout(() => {
          petBtn.style.background = "";
          petBtn.style.boxShadow = "";
        }, 2000);
      }, 3000);
    }

    // Test damage numbers
    if (window.createDamageNumber) {
      console.log("✓ Testing damage numbers");
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          window.createDamageNumber(
            300 + Math.random() * 200,
            200 + Math.random() * 100,
            Math.random() * 50 + 25,
            i === 0 ? "#36c777" : i === 1 ? "#ff6b6b" : "#3ec5ff"
          );
        }, i * 500);
      }
    }
  },

  // Run All Tests
  runAllTests: function () {
    console.log("🧪🧪🧪 RUNNING FULL A1K UI TEST SUITE 🧪🧪🧪");
    console.log("This will test all enhanced UI features...");

    const tests = [
      { name: "Game API", fn: this.testGameAPI, delay: 0 },
      { name: "Pet System", fn: this.testPets, delay: 2000 },
      { name: "Vehicle System", fn: this.testVehicles, delay: 8000 },
      { name: "Inventory", fn: this.testInventory, delay: 15000 },
      { name: "Filters", fn: this.testFilters, delay: 25000 },
      { name: "Fullscreen", fn: this.testFullscreen, delay: 30000 },
      { name: "Analytics", fn: this.testAnalytics, delay: 35000 },
      { name: "Visual Effects", fn: this.testVisualEffects, delay: 40000 },
    ];

    tests.forEach((test) => {
      setTimeout(() => {
        console.log(`\n🧪 === ${test.name.toUpperCase()} TEST ===`);
        test.fn.call(this);
      }, test.delay);
    });

    setTimeout(() => {
      console.log("\n🎉 ALL TESTS COMPLETED! 🎉");
      console.log(
        "Check above for results. Any ❌ indicates missing features."
      );
      window.A1K_UI?.showToast("🧪 All tests completed!", "success", 5000);
    }, 45000);
  },

  // Quick Status Check
  checkStatus: function () {
    console.log("📊 A1K Enhanced UI Status Check:");

    const checks = [
      {
        name: "Pet Button",
        check: () => !!document.getElementById("btnSummonPet"),
      },
      {
        name: "Vehicle Button",
        check: () => !!document.getElementById("btnCallVehicle"),
      },
      {
        name: "AP Button Removed",
        check: () => !document.getElementById("btnAutoAP"),
      },
      { name: "UI Patch Loaded", check: () => !!window.A1K_UI },
      { name: "Game API Loaded", check: () => !!window.Game?.spawnPet },
      {
        name: "Enhanced Inventory",
        check: () => !!document.querySelector(".bag-search-input"),
      },
      {
        name: "Paper Doll",
        check: () => !!document.querySelector(".paper-doll"),
      },
      {
        name: "Analytics System",
        check: () => typeof window.A1K_UI?.fireAnalyticsEvent === "function",
      },
    ];

    checks.forEach((check) => {
      const status = check.check() ? "✅" : "❌";
      console.log(`${status} ${check.name}`);
    });

    const passedChecks = checks.filter((c) => c.check()).length;
    const percentage = Math.round((passedChecks / checks.length) * 100);

    console.log(
      `\n📈 Overall Status: ${percentage}% (${passedChecks}/${checks.length} features active)`
    );

    if (percentage === 100) {
      console.log("🎉 Perfect! All enhanced UI features are active!");
      window.A1K_UI?.showToast("🎉 All UI features active!", "success");
    } else if (percentage >= 75) {
      console.log("👍 Good! Most features are working.");
      window.A1K_UI?.showToast(`👍 ${percentage}% features active`, "info");
    } else {
      console.log("⚠️  Some features may not be working properly.");
      window.A1K_UI?.showToast(
        `⚠️ Only ${percentage}% features active`,
        "error"
      );
    }
  },
};

// Auto-run status check when loaded
setTimeout(() => {
  if (window.A1K_Tests) {
    console.log("\n🔧 A1K Enhanced UI Test Suite Loaded");
    console.log("📋 Available test commands:");
    console.log("  - A1K_Tests.checkStatus()     // Quick status check");
    console.log("  - A1K_Tests.runAllTests()     // Full test suite");
    console.log("  - A1K_Tests.testPets()        // Test pet system");
    console.log("  - A1K_Tests.testVehicles()    // Test vehicle system");
    console.log("  - A1K_Tests.testInventory()   // Test inventory features");
    console.log("  - A1K_Tests.testFilters()     // Test search & filters");
    console.log("  - A1K_Tests.testAnalytics()   // Test analytics events");
    console.log("  - A1K_Tests.testGameAPI()     // Test game integration");
    console.log("\nRunning automatic status check...\n");

    A1K_Tests.checkStatus();
  }
}, 2000);
