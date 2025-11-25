# A1k Super Crew - Update Checklist

## Overview
Apply the same fixes and improvements from A1k Hero Crew to A1k Super Crew:
1. Auto-Equip Logic Fixes
2. Supernatural Tab Redesign

---

## ✅ Phase 1: Auto-Equip Logic Fixes

### Issues to Fix:
- [x] **High-level cores**: Auto-equip tries to equip cores player can't use (level requirements)
- [x] **Companions**: Only equips "best" companion, not ensuring one of each type is equipped
- [x] **Gear items**: No level requirement validation before equipping
- [x] **Core filtering**: Need to check actual equipability based on player level

### Implementation Steps:
- [x] Add `canEquipItem(item)` helper - checks `item.levelReq` vs `playerLevel`
- [x] Add `canEquipCore(core)` helper - checks core level requirements and low-tier mode
- [x] Update `isLowLevelCore()` - remove player level check (only check rarity/levelReq cap)
- [x] Update `getLowCorePool()` - filter by `canEquipCore()`
- [x] Fix gear equipping - filter candidates by `canEquipItem()` before sorting
- [x] Fix companion equipping - equip one of each type (pet, vehicle, spirit, robot, AI)
- [x] Fix core equipping - directly set `equippedCores` to bypass level checks
- [x] Enhanced feedback - better toast messages and console logging

### Files to Modify:
- `A1k Game Maker/A1k Super Crew/index.html`:
  - `heroCrewBagEnhancements` IIFE (around line 8573)
  - `isLowLevelCore()` function (line 8643)
  - `getLowCorePool()` function (line 8656)
  - `heroCrewAutoEquip()` function (line 8667)
  - Add new helper functions: `canEquipItem()`, `canEquipCore()`

---

## ✅ Phase 2: Supernatural Tab Redesign

### Current State:
- Supernatural tab exists in `A1KBagSystem.js` (line 17987)
- Uses basic card layout with filters
- Needs to match Talent tab's visual style

### Redesign Requirements:
- [x] **Header Section**: "Supernatural Workshop" with ledger-style currency display
- [x] **Currency Display**: Essence and Player Level in ledger cards
- [x] **Power Cards**: Grid layout matching Talent tab style
- [x] **Status Tags**: Learned/Locked/Level requirements
- [x] **Action Buttons**: Learn/Unlock buttons with consistent styling
- [x] **Visual Consistency**: Match Talent tab's color scheme and layout

### Files to Modify:
- `A1k Game Maker/A1k Super Crew/bag-system/A1KBagSystem.js`:
  - `renderSupernaturalTab()` function (line 17987)
  - `attemptLearnPower()` function (line 18254)

---

## 🧪 Testing Checklist

### Auto-Equip Testing:
- [ ] Test with low-level player (level 1-5) - should only equip low-level items
- [ ] Test with high-level player (level 30+) - should equip appropriate items
- [ ] Test with mixed inventory - should equip best available per slot
- [ ] Test companion equipping - should equip one of each type if available
- [ ] Test core equipping - should skip high-level cores player can't use
- [ ] Verify toast messages show accurate counts
- [ ] Check console for any errors or warnings

### Supernatural Tab Testing:
- [ ] Open Supernatural tab - verify new layout appears
- [ ] Check currency display (Essence and Level) shows correctly
- [ ] Test filter buttons (All, Elemental, Psychic, Cosmic)
- [ ] Test Learn Power button - verify gold deduction and power unlock
- [ ] Verify learned powers show in "Mastered" section
- [ ] Check visual consistency with Talent tab

---

## 📊 Implementation Statistics

- **Lines of Code**: ~200-250 LOC modifications
- **Tokens**: ~10k-15k tokens
- **Time**: 1-2 hours implementation + testing

---

## 🚀 Next Steps (After Implementation)

1. Open game in browser and test auto-equip
2. Test Supernatural tab redesign
3. Take screenshots for verification
4. Check console for errors
5. Verify all features work correctly

---

## ✅ Status: IN PROGRESS

Starting implementation now...
