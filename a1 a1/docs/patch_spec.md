
# A1K Runner – Inventory & Progression Patch (Work Order)

**Objectives**
- Autosell: sell all bag contents (items, gifts, non‑protected gear) using price map; exclude gear of rarity **Rare/Epic/Legendary**.
- Fix gift open: add **Open All Gifts** that iterates bag and applies existing gift logic.
- Equip rules: **Auto Equip (All)** distributes best gear to **A1/Unique/Missy** with **no sharing**.
- Level & boosts: caps — Player **101**, Pet **50**, Vehicle **20**.  1 AP/level (talents). Pets & Vehicles get **2 points/level** toward their trees.
- Unified AP: All trees earn points **from leveling**. Talent cap **200**. Each spent talent point applies **+50 ATK, +50 DEF, +50 HP**.
- Add header buttons to the Inventory overlay; keep selectors compatible with existing build.

**Integration**
1. Copy `patch_module.js` next to your HTML and include it **after** the main game script.
2. Ensure the Inventory overlay exists with grids `#bagGrid` or `#invGrid`.  
3. Call `A1KPatch.init()` on load (or when you open the Bag).
4. Optional: call `A1KPatch.addXP(n, 'player'|'pet'|'vehicle')` after kills to feed XP.

**Acceptance**
- Clicking **Auto Sell** reduces bag items and increments Gold by the correct amount.
- Clicking **Open All Gifts** consumes all gift boxes and produces rewards without freezing the UI.
- Clicking **Auto Equip (All)** moves gear out of the bag and assigns one per slot per hero.

