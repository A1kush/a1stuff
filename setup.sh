#!/bin/bash

# A1K Runner Game - Environment Setup Script
# This script sets up both Node.js and Python environments for the game development

set -e

echo "🎮 Setting up A1K Runner Game Development Environment..."

# Check if we're in the right directory
if [ ! -f "giftbox auto.html" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "Expected to find 'giftbox auto.html' in current directory"
    exit 1
fi

# 1. Node.js Setup
echo "📦 Setting up Node.js environment..."
cd "a1 a1"

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in 'a1 a1' directory"
    exit 1
fi

# Install Node.js dependencies
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# 2. Python Setup
echo "🐍 Setting up Python environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "../.venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv ../.venv
fi

# Activate virtual environment
source ../.venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install core requirements
if [ -f "requirements.txt" ]; then
    echo "Installing core Python dependencies..."
    pip install -r requirements.txt
fi

# Install development requirements
if [ -f "requirements-dev.txt" ]; then
    echo "Installing development Python dependencies..."
    pip install -r requirements-dev.txt
fi

# 3. Verify installations
echo "✅ Verifying installations..."

# Test Node.js setup
echo "Testing Node.js/Playwright setup..."
npm test || echo "⚠️  Some tests failed, but setup is complete"

# Test Python tools
echo "Testing Python tools..."
python -c "import PIL; print('✅ PIL/Pillow working')"
python -c "import imageio; print('✅ imageio working')"

# Test linting tools
echo "Testing development tools..."
ruff --version && echo "✅ ruff working"
black --version && echo "✅ black working"
mypy --version && echo "✅ mypy working"

# 4. Generate some sample assets to verify tools work
echo "🎨 Testing asset generation..."
if [ -f "tools/generate_flipbooks.py" ]; then
    cd tools
    python generate_flipbooks.py || echo "⚠️  Asset generation had issues, but tools are installed"
    cd ..
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Summary:"
echo "  - Node.js dependencies installed"
echo "  - Playwright browsers installed"
echo "  - Python virtual environment created at .venv"
echo "  - Python dependencies installed"
echo "  - Development tools (ruff, black, mypy) ready"
echo ""
echo "🚀 Next steps:"
echo "  1. Activate Python environment: source .venv/bin/activate"
echo "  2. Run tests: cd 'a1 a1' && npm test"
echo "  3. Generate assets: cd 'a1 a1/tools' && python generate_flipbooks.py"
echo "  4. Edit HTML game: open giftbox auto.html"
echo ""
echo "📁 Key files:"
echo "  - giftbox auto.html: Main game file"
echo "  - a1 a1/: Game assets and tools"
echo "  - a1 a1/tools/generate_flipbooks.py: VFX asset generator"
echo "  - a1 a1/tests/: Playwright test suite"