# Game Images Directory

Place all new game image assets (PNG, GIF, JPEG, WebP) in this folder.

## Recommended Subfolders

- `backgrounds/` – Level and parallax backgrounds
- `characters/` – Player and NPC sprite sheets
- `enemies/` – Enemy sprite sheets
- `vfx/` – Visual effects, particles, explosions
- `ui/` – Interface elements (icons, buttons, HUD pieces)
- `items/` – Collectibles, loot, inventory icons
- `projectiles/` – Bullets, missiles, beams
- `tiles/` – Environment tiles or modular pieces

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
