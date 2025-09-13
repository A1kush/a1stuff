# A1K v13.7 Starter Pack

Drop `/assets` into your project. On boot, load `assets/manifest/a1k_manifest.json` and hot-register:
- `raw_data/projectiles_v2.json` (new projectile schema and entries)
- `raw_data/auras.json` (ranged-idle aura + full-rage blessing VFX)
- `raw_data/status_effects.json` (atk_down, dizzy)
- `raw_data/falloff_tables.json` (40→30→20→10→10)
- `raw_data/ai_behaviors.json` (thresholds for ally AI)
- `raw_data/gameplay_overrides.json` (toggle damage overrides)

## How to test quickly
1. Set `enable_v13_7_damage_overrides` to **false**; verify parity.
2. Flip it to **true**; confirm Unique basic 100–230, A1/Missy basics 50–120, +30% skill multiplier.
3. Spawn Missy S2 to verify the 2k HP wall and blocking.
4. Toggle a debug line at CENTER_X to validate the clamp.
5. Run `tracker_tickets.md` as your QA script.

## Notes
- PNGs referenced can be placeholders; loader “notices” the folders and filenames.
- Status icons are mapped in the manifest under `status_icons`.
