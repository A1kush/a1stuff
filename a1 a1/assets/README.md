# A1K Runner Game - Development Environment

A hybrid Node.js/Python game development project with asset generation tools and automated testing.

## Project Structure

```
a1-a1/
├── giftbox auto.html          # Main HTML5 game file (4338 lines)
├── environment               # Wrapper that runs setup or setup.sh (for CI/Jules)
├── setup                     # Thin wrapper around setup.sh (optional)
├── setup.sh                  # Environment setup script (bash)
├── setup.ps1                 # Windows PowerShell setup
├── pyproject.toml            # Python development tools configuration
├── a1 a1/                    # Game assets and tools directory
│   ├── __init__.py           # Python package (v1.0.0)
│   ├── package.json          # Node.js dependencies
│   ├── requirements.txt      # Python core dependencies
│   ├── requirements-dev.txt  # Python development dependencies
│   ├── tools/
│   │   ├── generate_flipbooks.py  # VFX asset generator
│   │   └── __init__.py
│   ├── assets/               # Game asset directories
│   │   ├── backgrounds/
│   │   ├── characters/
│   │   ├── enemies/
│   │   ├── vfx/
│   │   └── ...
│   └── tests/                # Playwright test suite
│       ├── boot.spec.ts
│       ├── guardrails.spec.ts
│       └── ...
```

## Environment Setup

### Quick Start (Auto-detected in hosted/Jules environments)
If the platform runs `environment setup` automatically you do not need to do anything.
We provide an executable file named `environment` that forwards to `./setup` or `./setup.sh`.

### Automated Setup (Manual Invocation)

**Primary (portable)**
```bash
chmod +x environment
./environment setup
```

**Fallbacks**
```bash
chmod +x setup        # thin wrapper
./setup
# or direct script
chmod +x setup.sh
./setup.sh
```

**Windows PowerShell**
```powershell
./setup.ps1
```

The setup script will:
- Install Node.js dependencies and Playwright browsers
- Create Python virtual environment
- Install all Python dependencies
- Verify all tools are working
- Test asset generation

### Manual Setup

#### 1. Node.js Environment
```bash
cd "a1 a1"
npm install
npx playwright install
```

#### 2. Python Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or (Windows)
.venv\Scripts\activate
pip install -r "a1 a1/requirements.txt"
pip install -r "a1 a1/requirements-dev.txt"
```

## Development Tools

### Testing
```bash
cd "a1 a1"
npm test                    # Run Playwright tests (14 test cases)
```

### Asset Generation
```bash
cd "a1 a1/tools"
python generate_flipbooks.py  # Generate VFX flipbook animations
```

### Code Quality
```bash
ruff check --fix
black .
mypy "a1 a1"
```

## Dependencies

### Node.js
- `@playwright/test ^1.55.0`

### Python Core
- `pillow`
- `imageio`

### Python Development
- `pytest`
- `ruff`
- `mypy`
- `black`
- `apng`

## Game Features
The main game file (`giftbox auto.html`) includes:
- HTML5 canvas-based game engine
- Character movement and combat
- VFX system with flipbook animations
- Asset management and loading
- Game state management

## Development Workflow
1. Environment setup (wrapper or manual)
2. Generate / update VFX assets
3. Run tests (Playwright)
4. Lint & format Python
5. Commit changes

## Troubleshooting
- `environment: command not found`: ensure it has execute permission: `chmod +x environment`
- `setup: command not found`: run `./environment setup` or `./setup.sh`
- Playwright missing browsers: `npx playwright install`
- Pillow / numpy import errors: reinstall: `pip install --force-reinstall pillow numpy`
- Space in package path causes cosmetic lint warnings (N999) – safe to ignore