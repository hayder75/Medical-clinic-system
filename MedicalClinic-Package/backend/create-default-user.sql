-- Create Default Database User and Database for Client
-- This script creates the default client database setup

-- Create user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'clinic_user') THEN
        CREATE USER clinic_user WITH PASSWORD 'clinic_password';
    END IF;
END
$$;

-- Create database (if not exists)
SELECT 'CREATE DATABASE medical_clinic OWNER clinic_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medical_clinic')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE medical_clinic TO clinic_user;

-- Connect to the new database and grant schema privileges
\c medical_clinic

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO clinic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO clinic_user;

