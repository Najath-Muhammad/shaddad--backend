-- AlterTable: Add blockReason to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blockReason" TEXT;

-- AlterEnum: Add CANCELED to TripStatus
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'TripStatus' AND e.enumlabel = 'CANCELED') THEN
        ALTER TYPE "TripStatus" ADD VALUE 'CANCELED';
    END IF;
END $$;

-- AlterTable: Add cancelReason to trips
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
