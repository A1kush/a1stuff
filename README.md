# A1K Runner Game - Development Environment

A hybrid Node.js/Python game development project with asset generation tools and automated testing.

## Project Structure

```
a1-a1/
├── giftbox auto.html          # Main HTML5 game file (4338 lines)
├── setup.sh                  # Environment setup script
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

### Automated Setup (Recommended)

**For Jules Environment:**
```bash
# If you see "setup: command not found", try:
chmod +x setup
./setup

# Or alternatively:
chmod +x setup.sh
./setup.sh
```

**For Local Development:**
```bash
# Linux/Mac:
chmod +x setup.sh
./setup.sh

# Windows:
.\setup.ps1
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
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Install dependencies
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
ruff check --fix           # Lint and auto-fix Python code
black .                    # Format Python code
mypy "a1 a1"              # Type checking
```

## Dependencies

### Node.js
- `@playwright/test ^1.55.0` - End-to-end testing framework

### Python Core
- `pillow` - Image processing library
- `imageio` - Image I/O operations

### Python Development
- `pytest` - Testing framework
- `ruff` - Fast Python linter
- `mypy` - Static type checker  
- `black` - Code formatter
- `apng` - Animated PNG support

## Game Features

The main game file (`giftbox auto.html`) includes:
- HTML5 canvas-based game engine
- Character movement and combat
- VFX system with flipbook animations
- Asset management and loading
- Game state management

## Development Workflow

1. **Environment**: Use the setup script for initial configuration
2. **Assets**: Generate VFX assets using the Python tools
3. **Testing**: Run Playwright tests to verify game functionality
4. **Code Quality**: Use ruff/black for Python code formatting
5. **Version Control**: Git repository with main branch

## Troubleshooting

- **Python Path Issues**: Ensure virtual environment is activated
- **Asset Generation**: Check that PIL/Pillow is properly installed
- **Test Failures**: Verify Playwright browsers are installed
- **Linting Warnings**: N999 warnings due to package name with spaces are cosmetic only