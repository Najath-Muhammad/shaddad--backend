-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "TripStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "TripStatus" ADD VALUE 'GOING_TO_PICKUP';
ALTER TYPE "TripStatus" ADD VALUE 'DRIVER_ARRIVED';
ALTER TYPE "TripStatus" ADD VALUE 'CARGO_PICKED_UP';
ALTER TYPE "TripStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "TripStatus" ADD VALUE 'ARRIVED_AT_DESTINATION';
ALTER TYPE "TripStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "TripStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "deliveryOtp" TEXT,
ADD COLUMN     "deliveryPhotoUrl" TEXT;
