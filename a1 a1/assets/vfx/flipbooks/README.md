Flipbooks output folder.

Generator: tools/generate_flipbooks.py

Export spec: 1xN PNG strip and looping GIF preview. PNGs are named {FILENAME}.png and GIFs {FILENAME}_loop.gif

APNG: the generator will attempt to also write {FILENAME}.apng when `apng` Python package is available; GIF is always created as a preview fallback.

Pivot: center (use engine import settings to set pivot to center or bottom-center as needed)
