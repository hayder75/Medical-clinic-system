#!/bin/bash
# Script to package frontend for Windows distribution

echo "📦 Packaging frontend for distribution..."

# Go to frontend directory
cd frontend

# Verify .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Creating .env with VPS backend URL..."
    echo "VITE_API_URL=http://15.204.227.47:3001/api" > .env
fi

# Go back to root
cd ..

# Create zip excluding node_modules, dist, .git
echo "Creating zip file..."
zip -r medical-frontend.zip frontend \
    -x "frontend/node_modules/*" \
    -x "frontend/.git/*" \
    -x "frontend/dist/*" \
    -x "frontend/.vite/*" \
    -x "frontend/*.log" \
    -x "*.DS_Store"

# Check if zip was created
if [ -f medical-frontend.zip ]; then
    SIZE=$(du -h medical-frontend.zip | cut -f1)
    echo "✅ Created: medical-frontend.zip ($SIZE)"
    echo ""
    echo "📋 Zip file includes:"
    echo "   ✅ All source code"
    echo "   ✅ .env file with VPS backend URL"
    echo "   ✅ package.json and config files"
    echo "   ✅ WINDOWS_SETUP.md guide"
    echo "   ✅ QUICK_START.txt"
    echo "   ❌ Excluded: node_modules, dist, .git"
    echo ""
    echo "📤 Ready to send to your employer!"
else
    echo "❌ Failed to create zip file"
    exit 1
fi
