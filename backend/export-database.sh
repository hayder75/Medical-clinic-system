#!/bin/bash
# Database Export Script for Render Deployment
# This exports your local PostgreSQL database to be imported on Render

echo "📊 Exporting local PostgreSQL database..."
echo ""

# Get database connection details from .env
if [ -f .env ]; then
    source .env
else
    echo "⚠️  Warning: .env not found"
    exit 1
fi

# Simple approach: use connection string directly but fix schema parameter
# Remove schema parameter for pg_dump
CLEAN_DB_URL=$(echo "$DATABASE_URL" | sed 's/?schema=public//')

echo "Exporting database..."
echo "Connection string cleaned"

# Export the database using the connection string
pg_dump "$CLEAN_DB_URL" > database-export.sql

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully: database-export.sql"
    echo ""
    echo "📦 Next steps:"
    echo "1. Review database-export.sql (it contains your data)"
    echo "2. Get your Render PostgreSQL connection string from Render dashboard"
    echo "3. Import using: psql <render-connection-string> < database-export.sql"
    echo ""
    echo "⚠️  DO NOT commit database-export.sql to Git (already in .gitignore)"
else
    echo "❌ Error exporting database"
    exit 1
fi

