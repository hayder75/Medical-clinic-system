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

# Create zip - ONLY frontend folder, NO backend files
echo "Creating zip file (FRONTEND ONLY - no backend code)..."
zip -r medical-frontend.zip frontend \
    -x "frontend/node_modules/*" \
    -x "frontend/.git/*" \
    -x "frontend/dist/*" \
    -x "frontend/.vite/*" \
    -x "frontend/*.log" \
    -x "*.DS_Store" \
    -x "frontend/package-lock.json"

# Verify zip only contains frontend folder (no backend)
echo "Verifying zip contents..."
ZIP_CONTENTS=$(unzip -l medical-frontend.zip 2>/dev/null | head -20)
if echo "$ZIP_CONTENTS" | grep -q "^.*backend/"; then
    echo "❌ WARNING: Backend folder found in zip! This should not happen."
    echo "   Removing zip file for safety..."
    rm -f medical-frontend.zip
    exit 1
fi

# Verify frontend folder exists in zip
if ! unzip -l medical-frontend.zip 2>/dev/null | grep -q "frontend/"; then
    echo "❌ ERROR: Frontend folder not found in zip!"
    rm -f medical-frontend.zip
    exit 1
fi

echo "✅ Verified: Zip contains ONLY frontend folder (no backend)"

# Check if zip was created
if [ -f medical-frontend.zip ]; then
    SIZE=$(du -h medical-frontend.zip | cut -f1)
    echo "✅ Created: medical-frontend.zip ($SIZE)"
    echo ""
    echo "📋 Zip file includes (FRONTEND ONLY):"
    echo "   ✅ Frontend source code (React components)"
    echo "   ✅ .env file with VPS backend URL"
    echo "   ✅ package.json and config files"
    echo "   ✅ WINDOWS_SETUP.md guide"
    echo "   ✅ QUICK_START.txt"
    echo ""
    echo "❌ NOT included (for security):"
    echo "   ❌ Backend code"
    echo "   ❌ Database files"
    echo "   ❌ Server code"
    echo "   ❌ node_modules (will be installed by employer)"
    echo ""
    echo "📤 Ready to send to your employer!"
    echo "🔒 Backend remains secure on VPS - cannot be copied"
else
    echo "❌ Failed to create zip file"
    exit 1
fi
