"""
Flipbook generator for pixel-art VFX assets.
Generates 1xN PNG strips and GIF previews per user spec.
- Uses Pillow for image drawing and basic compositing.
- Outputs PNG strip and looping GIF preview (non-loop effects will have looping GIF too for preview).

Defaults: 128x128, 12 frames, 14 fps, pivot=center

Run: python tools/generate_flipbooks.py
"""
from PIL import Image, ImageDraw
import os
import math
import imageio
try:
    from apng import APNG
    APNG_SUPPORTED = True
except Exception:
    APNG_SUPPORTED = False

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'vfx', 'flipbooks')
OUT_DIR = os.path.abspath(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

# Palette
A1K = {
    'cyan': (0x00, 0xE5, 0xFF, 255),
    'purple': (0xA7, 0x8B, 0xFA, 255),
    'red': (0xFF, 0x3B, 0x3B, 255),
    'gold': (0xFF, 0xD5, 0x6A, 255),
    'black': (0,0,0,255),
}

DEFAULT = {
    'size': (128,128),
    'frames': 12,
    'fps': 14,
    'pivot': 'center'
}


def make_canvas(size):
    return Image.new('RGBA', size, (0,0,0,0))


def draw_sword_slash_diag(frame_index, frames, size):
    # Diagonal from bottom-left to top-right
    w,h = size
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    t = frame_index / frames
    # moving black core (thin)
    x0 = int(w*0.1 + t*(w*0.7))
    y0 = int(h*0.8 - t*(h*0.7))
    x1 = x0 + 12
    y1 = y0 + 12
    # black core uses the palette RGBA tuple directly
    draw.line((x0,y0,x1,y1), fill=A1K['black'], width=3)
    # neon rim cyan and purple glow (simple stroke by drawing thicker lines)
    draw.line((x0,y0,x1,y1), fill=A1K['cyan'], width=5)
    draw.line((x0-2,y0+2,x1-2,y1+2), fill=A1K['purple'], width=6)
    return img


def draw_slash_cross(frame_index, frames, size):
    # Two arcs crossing
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    # first arc (early frames)
    t = frame_index / frames
    # arc parameters
    cx,cy = w//2, h//2
    r = int(min(w,h)*0.5)
    angle = -90 + t*90
    # draw first arc core
    bbox = [cx-r, cy-r, cx+r, cy+r]
    draw.arc(bbox, start=angle, end=angle+40, fill=A1K['black'], width=3)
    draw.arc(bbox, start=angle, end=angle+40, fill=A1K['cyan'], width=5)
    # second arc appears after frame 3
    if frame_index >= 3:
        t2 = (frame_index-3)/(frames-3)
        angle2 = 90 - t2*90
        draw.arc(bbox, start=angle2, end=angle2+40, fill=A1K['black'], width=3)
        draw.arc(bbox, start=angle2, end=angle2+40, fill=A1K['purple'], width=5)
    return img


def draw_spin(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    radius = int(min(w,h)*0.35)
    progress = frame_index / frames
    # leading edge angle
    lead = progress*360
    # draw thin core circle slightly offset by lead
    for i in range(6):
        ang = math.radians(lead - i*6)
        x = cx + int(math.cos(ang)*radius)
        y = cy + int(math.sin(ang)*radius)
        draw.ellipse((x-3,y-3,x+3,y+3), fill=A1K['black'])
    # neon rim
    for i in range(4):
        ang = math.radians(lead - i*8)
        x = cx + int(math.cos(ang)*(radius+4))
        y = cy + int(math.sin(ang)*(radius+4))
        draw.ellipse((x-5,y-5,x+5,y+5), outline=A1K['cyan'], width=1)
    return img


def draw_uplift(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    t = frame_index / frames
    # arc from bottom-center rising to near top-center
    x0 = w//2 - 30
    y0 = int(h*0.85 - t*h*0.6)
    x1 = w//2 + 30
    y1 = y0 - 10
    draw.line((x0,y0,x1,y1), fill=A1K['black'], width=3)
    draw.line((x0,y0,x1,y1), fill=A1K['cyan'], width=5)
    # tiny ring at apex
    if frame_index == frames-2:
        draw.ellipse((w//2-8, y1-8, w//2+8, y1+8), outline=A1K['purple'], width=2)
    return img


def draw_slam(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    t = frame_index / frames
    cx,cy = w//2, int(h*0.6)
    # falling streak
    if frame_index < frames//2:
        y = int(h*0.1 + t*h*0.8)
        draw.line((cx, y-20, cx, y+20), fill=A1K['black'], width=4)
        draw.line((cx, y-20, cx, y+20), fill=A1K['red'], width=6)
    else:
        # impact starburst
        for i in range(8):
            ang = math.radians(i*45)
            x = cx + int(math.cos(ang)* (10 + (frame_index-frames//2)*4))
            y = cy + int(math.sin(ang)* (10 + (frame_index-frames//2)*4))
            draw.line((cx,cy,x,y), fill=A1K['black'], width=3)
            draw.line((cx,cy,x,y), fill=A1K['gold'], width=2)
    return img


def draw_fx_dark_aura_idle(frame_index, frames, size):
    # subtle pulsing void core with drifting rune pixels
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    # pulse radius
    pulse = 6 + int(3 * math.sin(2*math.pi*frame_index/frames))
    # black core
    draw.ellipse((cx-pulse, cy-pulse, cx+pulse, cy+pulse), fill=A1K['black'])
    # thin neon rim
    draw.ellipse((cx-pulse-2, cy-pulse-2, cx+pulse+2, cy+pulse+2), outline=A1K['cyan'], width=1)
    draw.ellipse((cx-pulse-4, cy-pulse-4, cx+pulse+4, cy+pulse+4), outline=A1K['purple'], width=1)
    # drifting rune pixels
    for i in range(5):
        ang = (frame_index*10 + i*73) % 360
        rx = cx + int(math.cos(math.radians(ang))*(pulse+6+i))
        ry = cy + int(math.sin(math.radians(ang))*(pulse+3+i))
        draw.point((rx,ry), fill=A1K['purple'])
    return img


def draw_fx_rage_surge_burst(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    # frame 0 white flash
    if frame_index == 0:
        draw.rectangle((0,0,w,h), fill=(255,255,255,255))
        return img
    t = frame_index/frames
    # expanding cyan ring
    r = int(4 + t* (min(w,h)))
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), outline=A1K['cyan'], width=2)
    # purple halo
    draw.ellipse((cx-r-4, cy-r-4, cx+r+4, cy+r+4), outline=A1K['purple'], width=1)
    # red danger specks
    for i in range(6):
        ang = (i*60 + frame_index*20) % 360
        sx = cx + int(math.cos(math.radians(ang))*(r+6))
        sy = cy + int(math.sin(math.radians(ang))*(r+6))
        draw.point((sx,sy), fill=A1K['red'])
    # shards eject
    for i in range(4):
        ang = math.radians(frame_index*30 + i*90)
        x2 = cx + int(math.cos(ang)*(r + frame_index*3))
        y2 = cy + int(math.sin(ang)*(r + frame_index*3))
        draw.line((cx,cy,x2,y2), fill=A1K['black'], width=1)
        draw.line((cx,cy,x2,y2), fill=A1K['gold'], width=1)
    return img


def draw_fx_shockwave_heavy(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    t = frame_index/frames
    r = int(t * max(w,h))
    # cyan edge
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), outline=A1K['cyan'], width=2)
    # purple halo (fainter)
    draw.ellipse((cx-r-3, cy-r-3, cx+r+3, cy+r+3), outline=A1K['purple'], width=1)
    # faint red mid-blink on odd frames
    if frame_index % 2 == 0:
        draw.ellipse((cx-r//2-2, cy-r//2-2, cx+r//2+2, cy+r//2+2), outline=A1K['red'], width=1)
    return img


def draw_fx_shadow_portal_spawn(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    t = frame_index/frames
    # iris opens (scale)
    r = int((t**0.5) * (min(w,h)//2))
    # black void center
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=A1K['black'])
    # neon rings
    draw.ellipse((cx-r-4, cy-r-4, cx+r+4, cy+r+4), outline=A1K['purple'], width=1)
    draw.ellipse((cx-r-8, cy-r-8, cx+r+8, cy+r+8), outline=A1K['cyan'], width=1)
    # lightning cracks (tiny lines)
    for i in range(6):
        ang = math.radians(i*60 + frame_index*15)
        x2 = cx + int(math.cos(ang)*(r+6))
        y2 = cy + int(math.sin(ang)*(r+6))
        draw.line((x2, y2, x2+int(math.cos(ang)*6), y2+int(math.sin(ang)*6)), fill=A1K['purple'], width=1)
    # falling sparks
    for i in range(4):
        sx = cx + (i-2)*6
        sy = cy + r + int(frame_index*2)
        draw.point((sx, sy%h), fill=A1K['gold'])
    return img


def draw_fx_shadow_portal_exit(frame_index, frames, size):
    # reverse of spawn
    rev = frames - 1 - frame_index
    return draw_fx_shadow_portal_spawn(rev, frames, size)


def draw_fx_boss_entrance(frame_index, frames, size):
    img = make_canvas(size)
    draw = ImageDraw.Draw(img)
    w,h = size
    cx,cy = w//2, h//2
    # vertical glitch bars drop
    for i in range(5):
        bx = cx - 24 + i*12
        by = int((frame_index/frames) * (h//2))
        draw.rectangle((bx, by-20, bx+8, by+int((i+1)*6)), fill=A1K['purple'])
    # heavy shock ring at mid frames
    if frame_index >= frames//3:
        r = int((frame_index-frames//3) * 6)
        draw.ellipse((cx-r, cy-r, cx+r, cy+r), outline=A1K['cyan'], width=2)
    # white flash frame 0
    if frame_index == 0:
        draw.rectangle((0,0,w,h), fill=(255,255,255,255))
    return img


def save_strip(frames_imgs, filename, size):
    w,h = size
    total_w = w * len(frames_imgs)
    strip = Image.new('RGBA', (total_w, h), (0,0,0,0))
    for i, img in enumerate(frames_imgs):
        strip.paste(img, (i*w,0), img)
    strip.save(filename)


def save_gif(frames_imgs, filename, fps):
    durations = int(1000 / fps)
    pil_frames = [img.convert('RGBA') for img in frames_imgs]
    pil_frames[0].save(filename, save_all=True, append_images=pil_frames[1:], duration=durations, loop=0, disposal=2)


def save_apng(frames_imgs, filename, fps):
    # fallback to GIF if APNG not available
    if not APNG_SUPPORTED:
        return False
    # write PNG frames to temp files then assemble
    temp_files = []
    for i, img in enumerate(frames_imgs):
        p = filename + f'.frame{i}.png'
        img.save(p)
        temp_files.append(p)
    apng = APNG()
    delay = int(1000/fps)
    for p in temp_files:
        apng.append_file(p, delay=delay)
    apng.save(filename)
    # cleanup
    for p in temp_files:
        try:
            os.remove(p)
        except:
            pass
    return True


def generate(effect_name, drawer, size=DEFAULT['size'], frames=DEFAULT['frames'], fps=DEFAULT['fps'], filename=None):
    imgs = []
    for i in range(frames):
        imgs.append(drawer(i, frames, size))
    if filename is None:
        filename = effect_name
    png_path = os.path.join(OUT_DIR, f"{filename}.png")
    gif_path = os.path.join(OUT_DIR, f"{filename}_loop.gif")
    save_strip(imgs, png_path, size)
    save_gif(imgs, gif_path, fps)
    print('Wrote', png_path, gif_path)


def main():
    presets = [
        ('atk_slash_diag_fwd', draw_sword_slash_diag, (128,128), 12, 14),
        ('atk_slash_cross', draw_slash_cross, (128,128), 12, 14),
        ('atk_slash_spin', draw_spin, (128,128), 14, 14),
        ('atk_slash_uplift', draw_uplift, (128,128), 12, 14),
    ('atk_slam_ground', draw_slam, (128,128), 12, 14),
    # Priority FX
    ('fx_dark_aura_idle', draw_fx_dark_aura_idle, (128,128), 16, 14),
    ('fx_rage_surge_burst', draw_fx_rage_surge_burst, (128,128), 12, 14),
    ('fx_shockwave_heavy', draw_fx_shockwave_heavy, (128,128), 12, 14),
    ('fx_shadow_portal_spawn', draw_fx_shadow_portal_spawn, (128,128), 12, 14),
    ('fx_shadow_portal_exit', draw_fx_shadow_portal_exit, (128,128), 12, 14),
    ('fx_boss_entrance', draw_fx_boss_entrance, (128,128), 12, 14),
    ]
    for name, drawer, size, frames, fps in presets:
        generate(name, drawer, size=size, frames=frames, fps=fps, filename=name)

if __name__ == '__main__':
    main()
