# A1 Sword Effects System

A comprehensive implementation of the A1 character's sword-based attacks and effects system with DBZ/Solo Leveling inspired visual effects.

## Features

### Effect Generation

- **Sword Trails**: Visual effects for sword swings in 4 color variations (blue, purple, red, gold)
- **Slash Effects**: Energy wave projectiles in 4 color variations
- **Dark Aura**: Pulsating dark energy surrounding the character
- **Twin Eclipse**: Special double-slash crossing effect

### Game Integration

- **A1 Character System**: Full configuration for A1's attacks and skills
- **Twin Eclipse Passive**: Chance for double damage on basic attacks
- **Rage System**: Accumulate rage with attacks to boost damage
- **Advanced Skill System**: 5 unique skills with custom effects

### Skills

1. **S1: Slash Wave** - Energy wave projectile
2. **S2: Dark Aura Strike** - Surround yourself with dark aura and strike nearby enemies
3. **S3: Twin Eclipse Combo** - Double-slash combo attack
4. **S4: Void Slash** - Space-tearing attack with extended range
5. **S5: Final Eclipse** - Ultimate combo of all sword techniques

## Usage

### Running the Effect Generator

```
python a1_sword_effects_generator.py
```

This will generate all the visual effects in the `generated_a1_effects` directory.

### Testing the System

```
python -m tests.test_a1_sword_system
```

This will run all tests to verify the system is working correctly.

### Demo

Open `a1_sword_demo.html` in a web browser to see a live demonstration of the A1 sword effects.

## Technical Details

### Effect Generation

The effects are generated using Python's PIL (Pillow) library with custom drawing algorithms to create dynamic visual effects that match the DBZ/Solo Leveling aesthetic.

### Game Integration

The A1 sword system integrates with the existing game through JavaScript hooks that enhance the base functionality without breaking existing systems.

### Testing

Comprehensive test suite ensures that:

1. All effect files are generated correctly
2. Game integration is properly implemented
3. All required features (Slash Wave, Dark Aura, Twin Eclipse, etc.) are present

## Future Enhancements

- **Enhanced Particle Effects**: Add more detailed particle systems
- **Sound Effects**: Add accompanying SFX for each skill
- **Skill Upgrades**: System for upgrading skills to more powerful versions
- **Combo System**: Allow chaining of skills for increased effects
