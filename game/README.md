# A1k Super Crew Runtime Notes

## Manifest-Driven Loader
- All runtime modules are described in `config/build-manifest.json`.
- Stages (`boot`, `systems`, `ui`, `telemetry`) control load order. Earlier stages (e.g. `boot`) should stay lean so config and buses initialize quickly.
- Inline modules now declare `data-inline-module` and are executed by the loader once feature flags allow it (`inlineLoader` flag).
- Add new modules by updating the manifest, then running the validator CLI (below) to ensure file paths resolve.

## Config Bridge & Feature Flags
- `config/config.js` boots with local defaults, then fetches live JSON from the FastAPI service (`GAME_CONFIG_ENDPOINT`).
- Local fallbacks live in `config/feature-flags.json`. Remote responses merge on top.
- Consumers can subscribe to updates via `window.GameConfigManager.subscribe(...)`. Every hydration also emits `config:update` on the global `A1KBus`.
- Feature flags (e.g. `missionBoard`, `debugOverlay`, `inlineLoader`, `missionTelemetry`) gate major systems at boot.

## CLI: Manifest Validator
Run the validator anytime you touch the manifest or add/remove modules:

```powershell
node "A1k Game Maker/A1k Super Crew/scripts/manifest-validate.mjs"
```

The script checks that every module path in `config/build-manifest.json` exists and reports missing files or stale entries. The process exits non‑zero when a violation is found so it can be wired into CI later.
