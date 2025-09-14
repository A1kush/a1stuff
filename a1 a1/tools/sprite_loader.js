/* Generic sprite manifest loader & slicer.
 * Usage (after this script loads and AFTER main game defines VFX.books):
 *   window.CustomSprites.load().then(()=>{
 *     // spawn a flipbook animation
 *     spawnFlip('angel_sheet', 600, 300);
 *   });
 */
(function(globals){
  const CustomSprites = {};
  const MANIFEST_URL = 'a1 a1/manifest/custom_sprites_manifest.json'.replace(/\s/g,'%20');
  let _ready = false;

  async function fetchManifest(){
    const res = await fetch(MANIFEST_URL);
    if(!res.ok) throw new Error('Failed manifest '+MANIFEST_URL);
    return res.json();
  }
  function sliceSheet(img, frameWidth, frameHeight, frameCount){
    const frames = [];
    for(let i=0;i<frameCount;i++){
      const c = document.createElement('canvas');
      c.width = frameWidth; c.height = frameHeight;
      const g = c.getContext('2d');
      g.drawImage(img, i*frameWidth, 0, frameWidth, frameHeight, 0,0, frameWidth, frameHeight);
      frames.push(c);
    }
    return frames;
  }
  function registerFlipbook(key, frames, fps){
    if(!globals.VFX) globals.VFX = { books:{} };
    globals.VFX.books[key] = frames;
    // attach metadata for optional timing (fps)
    if(!globals.VFX.meta) globals.VFX.meta = {};
    if(fps) globals.VFX.meta[key] = { fps };
  }
  async function load(){
    if(_ready) return;
    try{
      const manifest = await fetchManifest();
      const base = manifest.basePath || '';
      const promises = manifest.sprites.map(async s => {
        const img = await loadImage(base + s.file);
        if(s.frameCount && s.frameCount > 1){
          const frames = sliceSheet(img, s.frameWidth, s.frameHeight, s.frameCount);
          registerFlipbook(s.key, frames, s.fps || 10);
        } else {
          registerFlipbook(s.key, [img], s.fps || 1);
        }
      });
      await Promise.all(promises);
      _ready = true;
      console.log('[CustomSprites] Loaded', manifest.sprites.length, 'entries.');
    }catch(err){
      console.error('[CustomSprites] Error', err);
    }
  }
  function loadImage(url){
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  }
  CustomSprites.load = load;
  CustomSprites.registerFlipbook = registerFlipbook;
  globals.CustomSprites = CustomSprites;
})(window);
