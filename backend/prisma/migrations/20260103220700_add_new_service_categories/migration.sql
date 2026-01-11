-- AlterEnum
-- This migration adds the new service categories: NURSE_WALKIN, EMERGENCY_DRUG, MATERIAL_NEEDS
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE, so we use DO block to check first

DO $$ 
BEGIN
    -- Add NURSE_WALKIN to ServiceCategory enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NURSE_WALKIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')) THEN
        ALTER TYPE "ServiceCategory" ADD VALUE 'NURSE_WALKIN';
    END IF;
    
    -- Add EMERGENCY_DRUG to ServiceCategory enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EMERGENCY_DRUG' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')) THEN
        ALTER TYPE "ServiceCategory" ADD VALUE 'EMERGENCY_DRUG';
    END IF;
    
    -- Add MATERIAL_NEEDS to ServiceCategory enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MATERIAL_NEEDS' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')) THEN
        ALTER TYPE "ServiceCategory" ADD VALUE 'MATERIAL_NEEDS';
    END IF;
END $$;

