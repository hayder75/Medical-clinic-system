#!/bin/bash

# Copy Built Files to Client Deployment Folder
# Run this after build-package.sh to ensure everything is in client-deployment/

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Copying Files to Client Deployment Folder"
echo "═══════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLIENT_DEPLOY_DIR="$SCRIPT_DIR"
BUILD_DIR="$PROJECT_ROOT/build-package/MedicalClinic-System"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Please run ./build-package.sh first"
    exit 1
fi

echo "📦 Copying files from build to client-deployment..."
echo ""

# Create directories
mkdir -p "$CLIENT_DEPLOY_DIR/backend"
mkdir -p "$CLIENT_DEPLOY_DIR/frontend"

# Copy backend.exe
if [ -f "$BUILD_DIR/backend.exe" ]; then
    cp "$BUILD_DIR/backend.exe" "$CLIENT_DEPLOY_DIR/"
    echo "✅ Copied backend.exe"
else
    echo "⚠️  backend.exe not found in build"
fi

# Copy frontend
if [ -d "$BUILD_DIR/frontend/dist" ]; then
    cp -r "$BUILD_DIR/frontend/dist" "$CLIENT_DEPLOY_DIR/frontend/"
    echo "✅ Copied frontend/dist"
else
    echo "⚠️  frontend/dist not found in build"
fi

# Copy backend files
if [ -d "$BUILD_DIR/backend/prisma" ]; then
    cp -r "$BUILD_DIR/backend/prisma" "$CLIENT_DEPLOY_DIR/backend/"
    echo "✅ Copied backend/prisma"
fi

if [ -f "$BUILD_DIR/backend/.env.example" ]; then
    cp "$BUILD_DIR/backend/.env.example" "$CLIENT_DEPLOY_DIR/backend/"
    echo "✅ Copied backend/.env.example"
fi

# Create upload folders
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-attached-images"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/dental-photos"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/receipts"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-gallery"
echo "✅ Created upload folders"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Files copied to client-deployment folder!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Add PostgreSQL portable to: $CLIENT_DEPLOY_DIR/postgresql-portable/"
echo "2. Generate license: npm run license:trial"
echo "3. Copy license.enc to: $CLIENT_DEPLOY_DIR/backend/"
echo "4. Zip the folder and send to client"
echo ""

