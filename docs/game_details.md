## A1K Runner — Game Details

### Genre & Objective
- **Genre**: 2D lane-based action survival with waves → bosses
- **Party**: Three heroes (`A1`, `Unique`, `Missy`). One leader controlled; two followers assist with AI.
- **Objective**: Clear waves, defeat bosses, collect loot, upgrade via shop/gear/talents, progress stages.

### Core Loop
- **Loop**: Spawn wave → fight → pickups/XP → shop/upgrade → repeat.
- **Boss**: Final wave spawns boss/miniboss/gift boss; difficulty scales with stage.

### Controls
- **Move**: Virtual joystick (left). Double‑tap stick to jump.
- **Actions**: Shoot (hold), skills `S1/S2/S3`, `Shield`, `Rage` (when full), `Switch` leader.
- **Auto mode**: Holds shoot and cadences skills/defense under safe rules.

### Heroes
- **A1 (melee slayer)**: Fast melee chains + “wave” projectiles; parry/reflect window on swings; strong Rage burst.
- **Unique (ranged caster/marksman)**: Piercing shots; `S2` heal + freeze + shield; `S3` beam channel.
- **Missy (hybrid)**: Sword/pistol rhythm; `S2` summons guardian; `S3` spawns cat allies.

### Skills & Cooldowns
- **Per-hero**: `S1/S2/S3` with cooldowns; keys vary (burst, CC, summons, heal).
- **Shield**: Temporary barrier consuming MP.
- **Jump**: Evasion with proximity trigger to bullets.
- **Rage**: Fills via combat; activation grants ATK/haste/shield team buffs and hero‑specific bursts; chainable with item.

### Combat
- **Primary fire**: A1 melee combo; Unique heavy piercer; Missy sword/pistol pattern.
- **Projectiles**: Optional homing with capped deg/s turn + periodic reacquisition; floor‑rider waves glide lane `y` with bob.
- **Melee reflect**: A1/Missy can reflect overlapping enemy bullets during swing windows.
- **Facing**: Characters track input/nearest enemy; sprites flip horizontally when aiming left.
- **Turn‑around fix**: Nearest‑enemy targeting works in any direction (can shoot behind).

### Enemies & Waves
- **Types**: Mobs, Mob Leader, miniboss, gift boss, numbered bosses (scaled).
- **Behavior**: Forward pressure; fire patterns scale; some shields/reflects; miniboss/boss windows and cooldowns.
- **Global scalars**: Movement/fire‑rate tuned via config.

### Loot & Pickups
- **Currencies**: Gold, Silver, Tickets (Gems appear in UI).
- **Pickups**: Coins, silver, gifts; magnetized to player (range boosted by Magnet Aura).
- **XP orbs**: Fly toward HUD bar; leveling fuels AP and stats.

### Economy & Shop
- **Boosters**: XP +30% (15m), Drop +25% (15m), Magnet Aura (big pickup radius), Rage Starter (next stage full rage).
- **Consumables**: Revive Token, Respect/AP Reset, Boss/Stage Passes, Random Gear Kit.
- **Simple stat buys**: +Damage, +Fire Rate; inventory expansions; forge permits tiers.

### Inventory & Gear
- **Slots**: Weapon, Armor, Acc1, Acc2, Pet.
- **Bag**: Grid with quick actions (Equip/Upgrade/Sell/Fuse).
- **Scaling**: Basic stat scaling; shop/forge expand potential; pity and odds in economy config.

### Talents (AP)
- **AP**: Earn via levels; spend on attack/defense/utility nodes; keystone bonuses.
- **UI**: Shows AP spent/total; reset via token; some effects cascade (e.g., wave counts, reflect strength).

### UI & HUD
- **Bars**: HP, MP, XP (numeric optional), boss HP; optional per‑hero overhead Rage bars.
- **Dock**: Speed, Inventory, Auto, Pause, Shop, Settings.
- **On‑screen buttons**: `S1/S2/S3/Rage`, `Shield`, `Jump`, `Switch`, `R`.
- **Followers**: Non‑leader skill icons above followers with cooldown rings; tap to trigger.
- **Stage pill**: Stage/Wave/Kills; notifications/floaters for feedback.

### VFX & Assets
- **Procedural VFX**: Beams, slashes, explosions, smoke, fire, sparkle, portal, trails, afterimages, speedlines.
- **Palette**: Cyan `#00E5FF`, Purple `#A78BFA`, Red `#FF3B3B`, Gold `#FFD56A`.
- **Flipbooks (optional)**: 1×N PNG strips auto‑loaded from `assets/flipbooks` to override/augment procedural FX.
  - **Keys**: `skill_a1_shadow_claw`, `skill_a1_dark_ascent`, `skill_unique_soul_siphon`, `skill_unique_prism_finish`, `skill_missy_winged_guard`, `skill_missy_bubble_pop`, `proj_slashwave_dark`, `proj_cursed_bullet`, `fx_magnet_orbit`
  - **Default export spec**: Size 128×128 • Frames 12 • FPS 14 • `pivot=center`, unless noted in the prompt.
  - Preview GIF/APNG optional; game uses PNG strips.
- **Sprite loader**: Attempts `assets/img/A1.png`, `Unique.png`, `Missy.png`, `BG_mid.(gif|png)`, `BG_ground.(gif|png)`, `ico_coin_gold.png`, `ico_coin_silver.png`, `gift_chest.png`; Settings pane shows loaded/placeholder status.

### Files & Structure
- **Game**: `a1 12.html` (full engine/UI/systems); `a1 last update.html` is a variant.
- **Assets**: `assets/img` (sprites), `assets/flipbooks` (1×N strips), `assets/custom` (user drops).
- **Tools**: `assets/flipbooks/generate_flipbooks.py` to generate placeholder strips; `assets/flipbooks/README.md` for filenames/spec.

### Engine & Tech
- **Rendering**: Single canvas; pixelated; responsive scale to viewport.
- **Loop**: `requestAnimationFrame`, delta‑time update, timers per system (CDs, Rage, auras).
- **Physics**: Simple gravity, lane clamping, dash glide, orbiting followers; dodge‑jump on bullet proximity with cooldown.
- **Homing**: Capped deg/s turning (e.g., 180–300 deg/s by type), reacquire every ~150ms; airborne projectiles auto set clamps.
- **Waves/Stage**: Configurable wave counts, miniboss/gift boss distribution, victory, endless continue.

### Config ("PATCH/A1K")
- **Knobs**: Waves, projectile turn rates, rage values, UI flags, loot radii, economy odds/boosters, keystones, boss reflect toggles, etc.
- **Dev flag**: `?dev=1` may enable extra debug UI (e.g., wave debug labels).

### Debug & Tests
- **Turn‑around test**: `?test=1` spawns a mob behind leader, forces shoot, asserts leftward shot (PASS/FAIL floater + console).
- **Dev API**: `window.game` to set leader/speed/currencies, grant/reset AP, open/close drawers, modify inventory/equipment, cast skills, query secret/tank, etc.

### Recent Updates
- **Targeting fix**: Nearest‑enemy search now considers both sides (shoot behind).
- **Sprite facing**: Horizontal flip when aiming left.
- **Flipbooks**: External loader + hooks on key skills/projectiles; magnet aura uses flipbook when available.
- **Assets**: Created folders with placeholders so the loader resolves paths; Settings shows status.

---
Link this doc from the in‑game collapsible Help at the top of `a1 last update.html`.


