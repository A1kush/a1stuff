// Phase 23: The Blacksmith - Crafting, Dismantling, and Upgrading System

// Phase 23.2: Crafting Recipes
const CraftingRecipes = {
    recipes: [
        {
            id: 'sword_epic',
            name: 'Epic Sword',
            result: 'sword_epic',
            cost: { scrap: 10, fire_essence: 2 },
            category: 'weapon'
        },
        {
            id: 'armor_rare',
            name: 'Rare Armor',
            result: 'armor_rare',
            cost: { scrap: 15, essence: 3 },
            category: 'armor'
        },
        {
            id: 'evolution_stone',
            name: 'Evolution Stone',
            result: 'evolution_stone',
            cost: { scrap: 50, essence: 10 },
            category: 'material'
        },
        // Quick Feature 4: Additional crafting recipes
        {
            id: 'hp_potion_batch',
            name: 'HP Potion Batch',
            result: 'hp_potion',
            cost: { scrap: 5, essence: 1 },
            category: 'consumable',
            quantity: 5
        },
        {
            id: 'fire_blade',
            name: 'Fire Blade',
            result: 'fire_blade',
            cost: { scrap: 20, fire_essence: 5 },
            category: 'weapon'
        },
        {
            id: 'void_staff',
            name: 'Void Staff',
            result: 'void_staff',
            cost: { scrap: 30, essence: 8 },
            category: 'weapon'
        },
        {
            id: 'pet_cube',
            name: 'Green Cube Pet',
            result: 'pet_cube',
            cost: { scrap: 25, essence: 5 },
            category: 'pet'
        },
        {
            id: 'rage_pill_batch',
            name: 'Rage Pill Batch',
            result: 'rage_pill',
            cost: { scrap: 8, essence: 2 },
            category: 'consumable',
            quantity: 3
        }
    ],

    // Get recipe by ID
    getRecipe: (recipeId) => {
        return CraftingRecipes.recipes.find(r => r.id === recipeId);
    },

    // Check if player has materials
    canCraft: (recipeId) => {
        const recipe = CraftingRecipes.getRecipe(recipeId);
        if (!recipe) return false;

        if (!window.gameState || !window.gameState.inventory) return false;

        // Check each material requirement
        for (const material in recipe.cost) {
            const required = recipe.cost[material];
            const has = CraftingRecipes.getMaterialCount(material);
            if (has < required) return false;
        }

        return true;
    },

    // Get material count from inventory
    getMaterialCount: (materialId) => {
        if (!window.gameState || !window.gameState.inventory) return 0;

        const items = window.gameState.inventory.items || [];
        const material = items.find(item =>
            item && (item.id === materialId || item.name === materialId)
        );

        return material ? (material.quantity || 1) : 0;
    },

    // Craft item
    craft: (recipeId) => {
        const recipe = CraftingRecipes.getRecipe(recipeId);
        if (!recipe) return { success: false, message: 'Recipe not found' };

        if (!CraftingRecipes.canCraft(recipeId)) {
            return { success: false, message: 'Insufficient materials' };
        }

        // Remove materials
        for (const material in recipe.cost) {
            const required = recipe.cost[material];
            CraftingRecipes.removeMaterial(material, required);
        }

        // Add result item
        const resultItem = window.A1K_ITEMS_DB && window.A1K_ITEMS_DB[recipe.result];
        if (resultItem && window.BagSystem && typeof window.BagSystem.addItem === 'function') {
            const quantity = recipe.quantity || 1;
            window.BagSystem.addItem(recipe.result, quantity, resultItem);
        }

        return { success: true, item: resultItem };
    },

    // Remove material from inventory
    removeMaterial: (materialId, amount) => {
        if (!window.gameState || !window.gameState.inventory) return;

        const items = window.gameState.inventory.items || [];
        const materialIndex = items.findIndex(item =>
            item && (item.id === materialId || item.name === materialId)
        );

        if (materialIndex >= 0) {
            const material = items[materialIndex];
            material.quantity = (material.quantity || 1) - amount;
            if (material.quantity <= 0) {
                items.splice(materialIndex, 1);
            }
        }
    }
};

window.CraftingRecipes = CraftingRecipes;

// Phase 23.1: Dismantling System
const DismantlingSystem = {
    // Dismantle item into materials
    dismantle: (item) => {
        if (!item) return { success: false, message: 'No item selected' };

        // Calculate materials based on item rarity and level
        const materials = DismantlingSystem.calculateMaterials(item);

        // Remove item from inventory
        if (window.BagSystem && typeof window.BagSystem.removeItem === 'function') {
            // Find item in inventory and remove
            const inventory = window.gameState.inventory.items || [];
            const itemIndex = inventory.findIndex(i =>
                i && (i.id === item.id || i.uid === item.uid)
            );
            if (itemIndex >= 0) {
                inventory.splice(itemIndex, 1);
            }
        }

        // Add materials
        for (const material in materials) {
            const amount = materials[material];
            DismantlingSystem.addMaterial(material, amount);
        }

        return { success: true, materials: materials };
    },

    // Calculate materials from item
    calculateMaterials: (item) => {
        const rarityMultipliers = {
            common: 1,
            uncommon: 2,
            rare: 5,
            epic: 10,
            legendary: 20
        };

        const baseScrap = 5;
        const multiplier = rarityMultipliers[item.rarity] || 1;
        const levelBonus = (item.itemLevel || 1) * 2;

        const materials = {
            scrap: Math.floor(baseScrap * multiplier + levelBonus)
        };

        // Add essence based on element
        if (item.element) {
            const essenceType = `${item.element}_essence`;
            materials[essenceType] = Math.floor(multiplier * 0.5);
        }

        return materials;
    },

    // Add material to inventory
    addMaterial: (materialId, amount) => {
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.inventory) window.gameState.inventory = {};
        if (!window.gameState.inventory.items) window.gameState.inventory.items = [];

        // Check if material exists
        const materialIndex = window.gameState.inventory.items.findIndex(item =>
            item && (item.id === materialId || item.name === materialId)
        );

        if (materialIndex >= 0) {
            window.gameState.inventory.items[materialIndex].quantity =
                (window.gameState.inventory.items[materialIndex].quantity || 1) + amount;
        } else {
            // Create new material item
            window.gameState.inventory.items.push({
                id: materialId,
                name: materialId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                type: 'material',
                category: 'material',
                quantity: amount,
                icon: '⚙️'
            });
        }
    }
};

window.DismantlingSystem = DismantlingSystem;

// Phase 23.3: Item Upgrade System
const UpgradeSystem = {
    // Upgrade item
    upgrade: (item) => {
        if (!item) return { success: false, message: 'No item selected' };

        const currentLevel = item.itemLevel || 1;
        const maxLevel = item.upgrade?.maxLevel || 10;

        if (currentLevel >= maxLevel) {
            return { success: false, message: 'Item is already at max level' };
        }

        // Calculate upgrade cost
        const cost = UpgradeSystem.calculateUpgradeCost(item, currentLevel);

        // Check if player has enough gold
        if (!window.gameState || (window.gameState.gold || 0) < cost) {
            return { success: false, message: `Not enough gold. Need ${cost}` };
        }

        // Deduct gold
        window.gameState.gold = (window.gameState.gold || 0) - cost;

        // Upgrade item
        item.itemLevel = currentLevel + 1;

        // Scale stats by 10% per level
        const statMultiplier = 1.1;
        if (item.stats) {
            for (const stat in item.stats) {
                item.stats[stat] = Math.floor(item.stats[stat] * statMultiplier);
            }
        }

        // Also scale baseStats if exists
        if (item.baseStats) {
            for (const stat in item.baseStats) {
                item.baseStats[stat] = Math.floor(item.baseStats[stat] * statMultiplier);
            }
        }

        return { success: true, newLevel: item.itemLevel };
    },

    // Calculate upgrade cost
    calculateUpgradeCost: (item, currentLevel) => {
        const baseCost = item.upgrade?.costBase || 100;
        const growth = item.upgrade?.costGrowth || 1.25;
        return Math.floor(baseCost * Math.pow(growth, currentLevel - 1));
    }
};

window.UpgradeSystem = UpgradeSystem;
