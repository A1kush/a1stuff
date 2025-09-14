# Custom Sprites & Animations

This mini system lets you drop PNG sprite sheets into `a1 a1/assets/custom/` and declare them in `a1 a1/manifest/custom_sprites_manifest.json` without touching the large HTML game file.

## Folder Layout

```
a1 a1/
  assets/
    custom/              # put new png files here
  manifest/
    custom_sprites_manifest.json
  tools/
    sprite_loader.js
```

## Manifest Entry Fields

| Field | Required | Description |
|-------|----------|-------------|
| `key` | yes | Unique id used with `spawnFlip(key,x,y)` |
| `file` | yes | PNG file name (relative to `basePath`) |
| `frameWidth` / `frameHeight` | yes | Frame size (each frame laid out horizontally) |
| `frameCount` | yes | Number of frames across the sheet (1 for a single image) |
| `fps` | no | Playback speed hint (stored in `VFX.meta[key].fps`) |
| `origin.x / origin.y` | no | Anchor if you later want positional offsets |
| `usage` | no | Human note |

## Adding a New Sprite Sheet

1. Export / save your sheet into `assets/custom/` (e.g. `my_boss.png`).

2. Add a JSON object to the `sprites` array in `custom_sprites_manifest.json`:
```json
{
  "key": "my_boss_intro",
  "file": "my_boss.png",
  "frameWidth": 192,
  "frameHeight": 192,
  "frameCount": 12,
  "fps": 12,
  "origin": { "x": 96, "y": 160 },
  "usage": "Boss intro animation"
}
```
3. (Re)load the page OR call `CustomSprites.load()` again.
4. Spawn it: `spawnFlip('my_boss_intro', 800, 400);`

## Using in Game Code
After main game init (once `VFX.books` exists) ensure `sprite_loader.js` is loaded (add a `<script src="a1 a1/tools/sprite_loader.js"></script>` before main inline script OR append programmatically). Then:
After main game init (once `VFX.books` exists) ensure `sprite_loader.js` is loaded (add a `<script src="a1 a1/tools/sprite_loader.js"></script>` before main inline script OR append programmatically). Then:
```js
CustomSprites.load().then(()=>{
  spawnFlip('angel_sheet', 620, 280); // test
});
```
If you want the animation to loop continuously, you can push a custom effect:
```js
function loopSprite(key,x,y){
  const fb = VFX.books[key];
  if(!fb) return;
  st.effects.push({kind:'flip', fb, key, frame:0, x, y, life: Infinity, loop:true});
}
```
(You may extend the existing flip rendering logic to respect `loop` and `fps`.)

## Extending Rendering (Optional)

Inside the main game loop where `flip` effects advance frames, multiply frame advance by `(VFX.meta[key]?.fps/10)` if present to honor custom FPS.

## Tips

- Keep sheets power-of-two widths when possible for GPU friendliness (not required for canvas).
- Trim transparent padding to save memory.
- Group similar sized frames; large 256x256 sheets add up quickly.
- Use separate keys for different actions (e.g. `drone_idle`, `drone_fire`).

## Troubleshooting

- Open DevTools console; you should see `[CustomSprites] Loaded N entries.`
- 404 -> path mismatch (check spaces in folder name `a1 a1/`).
- Nothing appears: ensure you called `CustomSprites.load()` before spawning.

Enjoy expanding your sprite roster!
