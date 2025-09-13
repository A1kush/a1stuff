# A1K Runner Game - Agent Instructions

## Project Overview

This is a hybrid Node.js/Python game development project featuring:
- **Main Game**: `giftbox auto.html` - HTML5 canvas-based game (4338 lines)
- **Asset Tools**: Python scripts for generating VFX flipbook animations
- **Testing**: Playwright test suite with 14 test cases
- **Development**: Full linting/formatting pipeline with ruff, black, mypy

## Environment Requirements

### Runtime Dependencies
- **Node.js 18+** (for Playwright testing)
- **Python 3.8+** (for asset generation tools)

### Package Managers
- `npm` for Node.js dependencies
- `pip` with virtual environments for Python

## Setup Instructions for Agents

1. **Automated Setup**: Use the provided `setup.sh` script
2. **Manual Setup**: Follow README.md instructions
3. **Verification**: Run tests to ensure everything works

## Key Files for Agents

### Configuration Files
- `pyproject.toml` - Python tooling configuration (ruff, black, mypy, pytest)
- `a1 a1/package.json` - Node.js dependencies and test scripts
- `a1 a1/requirements.txt` - Core Python dependencies
- `a1 a1/requirements-dev.txt` - Development Python dependencies

### Source Code
- `giftbox auto.html` - Main game file (HTML/CSS/JavaScript)
- `a1 a1/tools/generate_flipbooks.py` - VFX asset generator
- `a1 a1/__init__.py` - Python package initialization (v1.0.0)

### Tests
- `a1 a1/tests/*.spec.ts` - Playwright test files
- Run with: `cd "a1 a1" && npm test`

## Development Workflow

### Code Quality Pipeline
```bash
# Python code quality
ruff check --fix           # Auto-fix linting issues
black .                    # Format code
mypy "a1 a1"              # Type checking

# Testing
cd "a1 a1"
npm test                   # Run all Playwright tests
```

### Asset Generation
```bash
cd "a1 a1/tools"
python generate_flipbooks.py  # Generate VFX animations
```

## Project Structure Details

```
a1-a1/                     # Root directory
├── giftbox auto.html      # Main game (4338 lines of HTML/JS/CSS)
├── setup.sh              # Environment setup script
├── README.md              # Documentation
├── agents.md              # This file
├── pyproject.toml         # Python tools config
└── a1 a1/                 # Python package and Node.js project
    ├── __init__.py        # Package init (version 1.0.0)
    ├── package.json       # Node dependencies (@playwright/test)
    ├── requirements.txt   # Python deps (pillow, imageio)
    ├── requirements-dev.txt # Dev deps (pytest, ruff, mypy, black, apng)
    ├── tools/
    │   ├── __init__.py
    │   └── generate_flipbooks.py  # VFX asset generator
    ├── assets/            # Game asset directories
    │   ├── backgrounds/
    │   ├── characters/
    │   ├── enemies/
    │   ├── vfx/
    │   └── ...
    └── tests/             # Playwright tests
        ├── boot.spec.ts
        ├── guardrails.spec.ts
        └── ...
```

## Agent Capabilities

### What Agents Can Do
- ✅ Install and configure development environment
- ✅ Run Python asset generation tools
- ✅ Execute Playwright test suite
- ✅ Apply code formatting and linting
- ✅ Generate new VFX assets
- ✅ Modify game logic in HTML file
- ✅ Update Python tools and add features

### Important Notes
- The package name "a1 a1" contains a space, causing cosmetic N999 linting warnings (harmless)
- Virtual environment recommended: `.venv` in project root
- Tests should all pass: 14/14 Playwright tests
- Asset generation creates flipbook animations for game VFX

## Common Tasks

### Initial Environment Setup
```bash
chmod +x setup.sh && ./setup.sh
```

### Development Cycle
```bash
# 1. Activate Python environment
source .venv/bin/activate

# 2. Make changes to code
# 3. Run quality checks
ruff check --fix
black .

# 4. Test changes
cd "a1 a1"
npm test

# 5. Generate new assets if needed
cd tools
python generate_flipbooks.py
```

### Adding New Features
1. Edit `giftbox auto.html` for game logic changes
2. Edit `a1 a1/tools/generate_flipbooks.py` for new VFX assets
3. Add tests in `a1 a1/tests/` for new functionality
4. Update documentation as needed

## Troubleshooting

### Common Issues
- **"Module not found"**: Ensure virtual environment is activated
- **Test failures**: Check Playwright browsers are installed (`npx playwright install`)
- **Asset generation errors**: Verify PIL/Pillow installation
- **Linting errors**: Most can be auto-fixed with `ruff check --fix`

### Verification Commands
```bash
# Check Python environment
python -c "import PIL; import imageio; print('Python deps OK')"

# Check Node environment
cd "a1 a1"
npm test

# Check development tools
ruff --version && black --version && mypy --version
```