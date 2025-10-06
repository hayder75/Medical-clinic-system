-- Database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (it should already exist from POSTGRES_DB)
-- But this is here as a safety measure
SELECT 'CREATE DATABASE medical_clinic_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medical_clinic_db')\gexec

-- Connect to the medical_clinic_db database
\c medical_clinic_db;

-- Create any additional database setup if needed
-- The Prisma schema will handle table creation
