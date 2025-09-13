# A1K Runner - Chibi DBZ/Solo Leveling Edition

A fast-paced runner game with chibi anime aesthetics inspired by Dragon Ball Z and Solo Leveling, featuring procedurally generated assets and enhanced UI.

## 🎮 Game Features

### Core Gameplay

- **3 Playable Characters**: A1, Unique, and Missy with unique abilities
- **Skill System**: 3 skills per character with elemental effects
- **Rage Mode**: Transform into powerful forms with enhanced abilities
- **Wave-based Combat**: Fight through increasingly difficult enemy waves
- **Boss Battles**: Epic encounters with powerful bosses

### New Chibi Asset System

- **Procedural Generation**: Python-based asset generator creates chibi-style sprites
- **DBZ/Solo Leveling Aesthetics**: Golden auras, energy effects, and anime-inspired visuals
- **Elemental Skills**: Fire, Ice, Lightning, Dark, and Light elements with unique effects
- **Character Spritesheets**: 8-frame animations for each character pose
- **Skill Icons**: Rarity-based skill icons with elemental theming

### Enhanced UI

- **Redesigned Inventory**: Smaller, more compact with chibi styling
- **Chibi Color Scheme**: Gold, orange, and blue gradients with glowing effects
- **Improved Navigation**: Streamlined bag system with better organization
- **Visual Effects**: Aura effects, particle systems, and glowing borders

## 🚀 Quick Start

1. **Open the Game**: Launch `best maybe.html` in your web browser
2. **Controls**:

   - `A` - Control A1 character
   - `U` - Control Unique character
   - `M` - Control Missy character
   - `Space` - Shoot
   - `1`, `2`, `3` - Use skills S1, S2, S3
   - `Tab` - Switch between characters

3. **Gameplay**:
   - Survive enemy waves and defeat bosses
   - Collect items and upgrade your characters
   - Use skills strategically to maximize damage
   - Build up rage to activate powerful transformations

## 🛠️ Development

### Asset Generation

The game includes a Python-based asset generator that creates chibi-style sprites and animations:

```bash
# Install dependencies
pip install -r requirements_assets.txt

# Generate assets
python chibi_asset_generator.py

# Run tests
python test_asset_generator.py
```

### Generated Assets

The asset generator creates:

- **Character Spritesheets**: 8-frame animations for each character
- **Skill Icons**: Elemental skill icons with rarity borders
- **Animated Effects**: GIF animations for special abilities
- **Manifest File**: JSON metadata for asset management

### File Structure

```
A1 Runner/
├── best maybe.html          # Main game file
├── chibi_asset_generator.py # Asset generation script
├── test_asset_generator.py  # Unit tests
├── requirements_assets.txt  # Python dependencies
├── generated_assets/        # Generated game assets
│   ├── a1_spritesheet.png
│   ├── unique_spritesheet.png
│   ├── missy_spritesheet.png
│   ├── fireball_icon.png
│   ├── lightning_strike_icon.png
│   └── manifest.json
└── README.md               # This file
```

## 🎨 Asset System

### Character Styles

- **A1**: DBZ-inspired with golden auras and fire effects
- **Unique**: Solo Leveling-inspired with blue/purple energy
- **Missy**: DBZ-inspired with pink/cyan effects

### Elemental System

- **Fire**: Red/orange effects with flame particles
- **Ice**: Blue/cyan effects with crystal formations
- **Lightning**: Yellow/gold effects with electric sparks
- **Dark**: Purple/violet effects with shadow particles
- **Light**: White/gold effects with radiant auras

### Rarity System

- **Common**: Gray borders
- **Rare**: Blue borders
- **Epic**: Purple borders
- **Legendary**: Gold borders

## 🔧 Technical Details

### Save System

- **Version**: 2.1.0 (bumped for chibi assets)
- **New Keys Added**:
  - `chibiAssetsLoaded`: Boolean flag for asset loading
  - `chibiEffectsEnabled`: Toggle for enhanced visual effects
  - `elementalMastery`: Progress tracking for elemental skills

### Performance

- **Asset Loading**: Asynchronous loading with fallbacks
- **Memory Management**: Efficient sprite sheet usage
- **Effect Optimization**: Particle systems with automatic cleanup

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Canvas API**: Required for rendering
- **WebGL**: Optional for enhanced effects

## 🎯 Game Balance

### Character Stats

- **A1**: High attack, medium defense, fire element
- **Unique**: Balanced stats, lightning element
- **Missy**: High defense, medium attack, ice element

### Skill Cooldowns

- **S1**: 3-6 seconds (basic skills)
- **S2**: 10-25 seconds (powerful skills)
- **S3**: 16-40 seconds (ultimate skills)

### Progression

- **Level System**: Gain XP from defeating enemies
- **Talent Trees**: Upgrade attack, defense, and special abilities
- **Equipment**: Weapons, armor, and accessories with stat bonuses
- **Pets**: Companion creatures with unique abilities

## 🐛 Known Issues

- Asset loading may take a moment on first run
- Some older browsers may not support all visual effects
- Mobile controls are not yet optimized

## 🔮 Future Updates

- [ ] Mobile touch controls
- [ ] Additional character classes
- [ ] More elemental combinations
- [ ] Multiplayer co-op mode
- [ ] Achievement system
- [ ] Sound effects and music

## 📝 Changelog

### Version 2.1.0 - Chibi Asset Update

- ✅ Removed A1 U M stat box from UI
- ✅ Redesigned inventory UI with chibi styling
- ✅ Added procedural asset generation system
- ✅ Implemented DBZ/Solo Leveling visual themes
- ✅ Created elemental skill system
- ✅ Added comprehensive unit tests
- ✅ Enhanced skill effects with aura animations

### Version 2.0.0 - UI Overhaul

- Enhanced inventory system
- Improved character progression
- Better visual feedback

### Version 1.0.0 - Initial Release

- Basic runner gameplay
- Three playable characters
- Skill system implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the test suite
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by Dragon Ball Z and Solo Leveling
- Built with HTML5 Canvas and JavaScript
- Asset generation powered by Python and PIL
- Special thanks to the anime community for inspiration

---

**Enjoy the game and may your auras shine bright! 🌟**
