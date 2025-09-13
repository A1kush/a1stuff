# Game Images Directory

Place all new game image assets (PNG, GIF, JPEG, WebP) in this folder.

## Recommended Subfolders

- `backgrounds/` – Level and parallax backgrounds
- `characters/` – Player and NPC sprite sheets / animations
- `enemies/` – Enemy sprite sheets / boss phases
- `vfx/` – Core visual effect strips (explosions, auras)
- `ui/` – Interface elements (icons, buttons, HUD pieces)
- `items/` – Collectibles, inventory icons, powerups
- `projectiles/` – Bullets, missiles, beams, trails
- `tiles/` – Environment tiles or modular pieces
- `loot/` – Drop art separate from inventory icons
- `skills/` – Skill-specific icons or effect overlays
- `pets/` – Companion / follower sprites
- `hud/` – HUD overlays (frames, bars, meters) distinct from generic UI
- `effects/` – High-level composed effects (may reference `particles/` and `vfx/` sources)
- `particles/` – Tiny particle elements used to build larger effects
- `spritesheets/` – Raw packed sheets prior to slicing or tooling
- `temp/` – Temporary work-in-progress art (clean regularly)
- `raw/` – Source originals before optimization/compression
- `icons/` – General-purpose small UI icons not tied to items/skills

## Naming Conventions

Use lowercase with underscores:

```text
player_idle_strip_8.png
boss_phase2_charge_strip_16.png
fireball_proj_loop.gif
ui_health_bar_frame.png
```

If using sprite sheets, include `_strip_<framecount>` or `_grid_<cols>x<rows>` in the name.

## Optimization Tips

- Prefer PNG for pixel art & transparency.
- Use GIF only for quick previews (convert to PNG strip or APNG for production).
- Keep large background images under ~4096px per dimension when possible.
- Compress where possible (e.g., `pngquant`, `oxipng`).

## Referencing in Code

When integrating, update your asset loader or manifest files (e.g., `manifest/assets_manifest.json` or similar) to include the new paths.

## Attributions

If assets are externally sourced, add a short note in `CREDITS.md` (create if needed).

---
Feel free to add more subfolders as the project expands.
