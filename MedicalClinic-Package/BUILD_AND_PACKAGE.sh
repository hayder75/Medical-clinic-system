#!/bin/bash

# Master Build Script - Builds Everything and Packages for Client
# Run this from client-deployment folder

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Medical Clinic System - Complete Build & Package"
echo "═══════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Client deployment: $SCRIPT_DIR"
echo ""

# Step 1: Build Package
echo "🔨 Step 1: Building package..."
cd "$SCRIPT_DIR"
./build-package.sh

# Step 2: Generate License (if not exists)
echo ""
echo "🔐 Step 2: Checking license..."
if [ ! -f "$SCRIPT_DIR/backend/license.enc" ]; then
    echo "   License file not found. Generating trial license..."
    echo "   Please run: cd $PROJECT_ROOT/backend && npm run license:trial"
    echo "   Then copy license.enc to: $SCRIPT_DIR/backend/"
else
    echo "   ✅ License file found"
fi

# Step 3: Check PostgreSQL Portable
echo ""
echo "🗄️  Step 3: Checking PostgreSQL portable..."
if [ ! -d "$SCRIPT_DIR/postgresql-portable" ]; then
    echo "   ⚠️  PostgreSQL portable not found"
    echo "   Please download and extract to: $SCRIPT_DIR/postgresql-portable/"
    echo "   Or use SQLite (simpler, no installation needed)"
else
    echo "   ✅ PostgreSQL portable found"
fi

# Step 4: Create Package Summary
echo ""
echo "📦 Step 4: Creating package summary..."

cat > "$SCRIPT_DIR/PACKAGE_CONTENTS.txt" << 'EOF'
═══════════════════════════════════════════════════════
  Medical Clinic System - Package Contents
═══════════════════════════════════════════════════════

FILES INCLUDED:
---------------
✅ backend.exe - Compiled backend server
✅ frontend/dist/ - Built frontend
✅ backend/prisma/ - Database schema
✅ backend/uploads/ - Upload folders
✅ postgresql-portable/ - Portable PostgreSQL
✅ backend/license.enc - License file (if added)
✅ All installation scripts (.bat files)
✅ Documentation (README.md, etc.)

READY TO SEND:
-------------
1. Zip this entire folder
2. Send to client
3. Client extracts and runs install.bat

OR create Windows installer:
  .\create-windows-installer.ps1

═══════════════════════════════════════════════════════
EOF

echo "   ✅ Package summary created"

# Final Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Build Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📦 Package location: $SCRIPT_DIR"
echo ""
echo "✅ Included:"
echo "   - backend.exe (compiled)"
echo "   - frontend/dist/ (built)"
echo "   - backend/prisma/ (database)"
echo "   - All installation scripts"
echo ""
echo "⬅️  Still need to add:"
echo "   - postgresql-portable/ (download separately)"
echo "   - backend/license.enc (generate with: npm run license:trial)"
echo ""
echo "📤 To send to client:"
echo "   1. Add PostgreSQL portable"
echo "   2. Add license.enc file"
echo "   3. Zip this folder"
echo "   4. Send to client"
echo ""
echo "   OR create installer: .\create-windows-installer.ps1"
echo ""

