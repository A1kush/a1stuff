A1K Runner — PATCH v4 Pack (Rebuild)
Generated: 2025-08-30T04:18:52.697159Z

Folders:
- index_patch_snippets/  -> paste-ready config + hooks
- assets/                -> final folders for art
- assets/raw_uploads/    -> put your original zips here (this build leaves it empty if none are present)

How to apply:
1) Paste PATCH_v4_config.js after your existing PATCH block.
2) Merge PATCH_v4_hooks.txt at the marked sites (enemy update loop, mob fire cadence, projectile→player damage guard, loot roll, equip init+recalc, per-frame petTick, draw overheads, skill spawns, A1/Missy basics).
3) Move your final sprites into assets/{players,enemies,bullets,fx,ui,backgrounds,pets,items,fonts} and update loader paths accordingly.

Tip: If you want me to auto-merge these into your latest index.html, send that file and I’ll return a patched build.
