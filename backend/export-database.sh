#!/bin/bash
# Database Export Script for Render Deployment
# This exports your local PostgreSQL database to be imported on Render

echo "📊 Exporting local PostgreSQL database..."
echo ""

# Get database connection details from .env
source .env 2>/dev/null || echo "⚠️  Warning: .env not found, using defaults"

DB_NAME=${DATABASE_URL##*/} || DB_NAME="clinicdb"
DB_NAME=${DB_NAME%%\?*}

# Export the database
echo "Exporting database: $DB_NAME"
pg_dump "$DATABASE_URL" > database-export.sql

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

