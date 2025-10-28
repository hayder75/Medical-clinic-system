# 🚀 Render Deployment Guide

## Prerequisites
1. ✅ Render account created
2. ✅ Web service deployed (already done)
3. ⚠️ **PostgreSQL database service created on Render**

## Step 1: Create PostgreSQL Database on Render

1. Go to Render Dashboard: https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `medical-clinic-db`
   - **Database**: `clinicdb`
   - **User**: Will be auto-generated
   - **Region**: Same as your web service
   - **PostgreSQL Version**: Latest
4. Click "Create Database"
5. **Save the connection string** (Internal Database URL or External Connection String)

## Step 2: Export Local Database

Run the export script:
```bash
cd backend
./export-database.sh
```

This creates `database-export.sql` with all your local data.

## Step 3: Connect Local Environment to Render DB

**Option A: Using Render Connection String**
```bash
# Get connection string from Render dashboard
DATABASE_URL="postgresql://user:password@hostname:5432/clinicdb?sslmode=require"

# Import data
psql "$DATABASE_URL" < database-export.sql
```

**Option B: Manual Import via pg_dump**
```bash
# Export from local
pg_dump "$DATABASE_URL_LOCAL" > backup.dump

# Import to Render (replace with your Render connection string)
pg_restore -h <render-host> -U <render-user> -d clinicdb backup.dump
```

## Step 4: Update Render Environment Variables

In your Render web service dashboard:
1. Go to Settings → Environment
2. Add/Update:
   ```
   DATABASE_URL=postgresql://user:password@render-host:5432/clinicdb?sslmode=require
   ```
3. Save changes (will trigger redeploy)

## Step 5: Verify Deployment

1. Check Render logs for successful database connection
2. Visit your app: https://medical-clinic-system.onrender.com
3. Login with existing credentials
4. Verify data is present

## Important Files in Git

✅ **MUST be committed:**
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/migrations/` - Migration files
- `backend/package.json` - Dependencies

❌ **MUST NOT be committed:**
- `database-export.sql` - Contains sensitive data
- `*.dump` files - Database dumps
- `.env` files - Environment variables (set on Render)

## Troubleshooting

**Error: "Database not found"**
- Ensure PostgreSQL service is created on Render
- Check connection string is correct
- Verify SSL mode if using external connection

**Error: "Migration failed"**
- Ensure `prisma/migrations/` is NOT in `.gitignore`
- Check that migrations are committed to Git
- Review Prisma logs on Render

**Error: "Empty database on Render"**
- Data transfer didn't complete successfully
- Check psql/pg_restore command executed without errors
- Verify connection string format

## Quick Data Transfer Commands

```bash
# From your local machine:
# 1. Export
pg_dump postgresql://localhost:5432/clinicdb > backup.sql

# 2. Import to Render (use your Render connection string)
psql <render-connection-string> < backup.sql
```

