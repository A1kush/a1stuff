# A1K UI Integration Guide

## Overview

The A1K UI Refine Bundle has been successfully integrated into your A1 Runner project. This provides a compact, chibi-styled UI with enhanced functionality including squad stats display, inventory expansion, and auto-upgrade features.

## What's Been Added

### 1. CSS & JavaScript Files

- `css/ui.css` - Chibi-styled UI components
- `js/hud_stats.js` - HUD stats panel and hide/show logic
- `js/inventory_system.js` - Inventory expansion and auto-upgrade system

### 2. UI Assets

**UI Elements** (`assets/ui/`):

- Badge system: `badge_a1.png`, `badge_m.png`, `badge_u.png`
- Mini progress bars: `bar_hp_small.png`, `bar_rage_small.png`, `bar_xp_small.png`
- Chibi buttons: `btn_dungeon.png`, `btn_hide.png`, `btn_hide_all.png`, `btn_inventory.png`, `btn_pets.png`, `btn_show.png`, `btn_speed.png`, `btn_vehicles.png`
- Panel backgrounds: `panel_pill_small.png`, `panel_squad_small.png`

**VFX Elements** (`assets/vfx/`):

- `aura_pulse_64.gif` - Animated aura effect preview
- `aura_pulse_strip8_64.png` - 8-frame sprite strip for aura animation

### 3. New UI Components

#### Chibi Topbar

A compact button bar with the following controls:

- Speed toggle (×1, ×2, ×4, etc.)
- Inventory access
- Pets management
- Vehicles management
- Dungeon access
- Hide All toggle

#### Squad Stats Panel

A compact 260×92px panel showing:

- A1 (cyan): ATK/DEF stats
- U (purple): ATK/DEF stats
- M (red): ATK/DEF stats
- Hide button for the panel

### 4. Enhanced Features

#### Auto-Inventory Management

- **Capacity Expansion**: +5 slots for Gear/Pets/Vehicles/Talents (now 36/20/16/12 slots)
- **Auto-Route**: New items automatically sort into appropriate tabs
- **Auto-Upgrade**: Intelligent equipment upgrades using `(ATK + DEF) × rankWeight` scoring
- **Rank Protection**: Preserves Rare/Epic/Legendary items unless strictly better replacements found

#### Save System Updates

- **Save Version**: Bumped to version 24
- **Persistent Settings**: UI hide states saved to localStorage
- **Inventory Preferences**: Auto-upgrade and routing preferences preserved

## API Reference

### A1K.anchorStatsUnderCluster()

Positions the squad stats panel under the Speed/Inventory/Pets button cluster. Call this on:

- Window resize
- HUD scale changes
- Layout updates

### A1K.toggleStats(force)

Shows/hides the squad stats panel.

- `force` (optional boolean): true to show, false to hide, undefined to toggle

### A1K.toggleTopHUD(force)

Shows/hides the entire top HUD bar.

- `force` (optional boolean): true to show, false to hide, undefined to toggle

### A1K.renderSquadStats(a1, u, m)

Updates the squad stats display with current character data.

- `a1`, `u`, `m`: Objects with `{atk, def}` properties

### A1K.expandInventory()

One-time migration to expand inventory capacity (+5 slots per category).

### A1K.routeItem(item)

Auto-routes a new item to the appropriate inventory tab based on item.type.

- `item`: Object with `type` property ('weapon', 'armor', 'pet', 'vehicle', etc.)

### A1K.autoUpgrade(charSheet)

Automatically equips best-in-slot gear for a character.

- `charSheet`: Character object with `slots: {weapon, armor, accessory}` structure
- Returns: Updated character sheet with optimal equipment

## Integration Points

### Character Data Connection

The system automatically pulls character stats from your existing `party` array:

```javascript
// A1 stats from party[0].sheet.{atk, def}
// U stats from party[1].sheet.{atk, def}
// M stats from party[2].sheet.{atk, def}
```

### Button Event Binding

The new topbar buttons are wired to your existing functions:

- `btnSpeed` - Speed toggle functionality
- `btnInventory` - Opens inventory system
- `btnPets` - Opens pets management
- `btnVehicles` - Opens vehicles system
- `btnDungeon` - Opens dungeon interface

## Customization

### Styling

The UI uses CSS custom properties for easy theming:

```css
:root {
  --void: #0b0f1a; /* Deep void background */
  --cyan: #00e5ff; /* Neon cyan accents */
  --purple: #a78bfa; /* Purple highlights */
  --danger: #ff3b3b; /* Danger/warning color */
}
```

### Inventory Settings

Modify auto-upgrade behavior via `A1K.inv.prefs`:

```javascript
A1K.inv.prefs = {
  keepRarePlus: true, // Protect Rare+ items
  rankWeight: {
    // Scoring multipliers
    Common: 1,
    Gift: 1.2,
    Rare: 1.6,
    Epic: 2.1,
    Legendary: 3.0,
  },
};
```

### Pricing Table

Item values for auto-sell features:

```javascript
A1K.prices = {
  Common: 100, // 100 gold
  Gift: 200, // 200 gold
};
```

## Testing

Run the provided test suite to validate integration:

```bash
python tests/test_manifest.py
```

This validates:

- All asset files exist and have correct dimensions
- Spritesheet math is accurate
- UI component positioning is correct

## Next Steps

### Recommended Enhancements

1. **Tab Icons**: Generate chibi micro-icons for gear/pet/vehicle tabs using the same art pipeline
2. **Per-Tab Spritesheets**: Create consolidated sprite sheets for each inventory category
3. **Animation Integration**: Wire up the VFX aura animations to level-up/skill-unlock events
4. **Mobile Optimization**: Adjust button sizes and panel positioning for mobile screens

### Custom Integration Hooks

Add these hooks to enhance the system further:

```javascript
// Hook into item acquisition
function onItemReceived(item) {
  A1K.routeItem(item); // Auto-route to appropriate tab
}

// Hook into character stat updates
function onStatsChanged() {
  A1K.anchorStatsUnderCluster(); // Reposition if needed
}

// Hook into equipment changes
function onGearEquipped(character) {
  if (A1K.autoUpgrade) {
    character.sheet = A1K.autoUpgrade(character.sheet);
  }
}
```

The UI system is now fully integrated and ready for use. The chibi aesthetic provides a more compact, visually appealing interface while maintaining all existing functionality and adding powerful new automation features.
