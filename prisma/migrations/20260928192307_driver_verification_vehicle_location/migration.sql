-- CreateEnum
CREATE TYPE "DriverAvailability" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('DYNA', 'PICKUP_SMALL', 'PICKUP_LARGE', 'TRAILER', 'FLATBED', 'REFRIGERATED', 'BOX_TRUCK');

-- AlterEnum
BEGIN;
CREATE TYPE "DriverVerificationStatus_new" AS ENUM ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED');
ALTER TABLE "driver_profiles" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "driver_profiles" ALTER COLUMN "verificationStatus" TYPE "DriverVerificationStatus_new" USING ("verificationStatus"::text::"DriverVerificationStatus_new");
ALTER TYPE "DriverVerificationStatus" RENAME TO "DriverVerificationStatus_old";
ALTER TYPE "DriverVerificationStatus_new" RENAME TO "DriverVerificationStatus";
DROP TYPE "DriverVerificationStatus_old";
ALTER TABLE "driver_profiles" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING_VERIFICATION';
COMMIT;

-- AlterTable
ALTER TABLE "driver_profiles" DROP COLUMN "isOnline",
ADD COLUMN     "availability" "DriverAvailability" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "licenseExpiryDate" TIMESTAMP(3),
ADD COLUMN     "licenseUrl" TEXT,
ADD COLUMN     "nationalIdBackUrl" TEXT,
ADD COLUMN     "nationalIdExpiryDate" TIMESTAMP(3),
ADD COLUMN     "nationalIdFrontUrl" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "totalTripsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByAdminId" TEXT,
ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING_VERIFICATION';

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverProfileId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "maxWeightKg" DOUBLE PRECISION NOT NULL,
    "maxLengthCm" DOUBLE PRECISION,
    "isRefrigerated" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "registrationUrl" TEXT,
    "registrationExpiry" TIMESTAMP(3),
    "insuranceUrl" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "vehiclePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_driverProfileId_key" ON "vehicles"("driverProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");

-- CreateIndex
CREATE INDEX "vehicles_vehicleType_idx" ON "vehicles"("vehicleType");

-- CreateIndex
CREATE INDEX "vehicles_plateNumber_idx" ON "vehicles"("plateNumber");

-- CreateIndex
CREATE INDEX "driver_profiles_verificationStatus_idx" ON "driver_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "driver_profiles_availability_idx" ON "driver_profiles"("availability");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverProfileId_fkey" FOREIGN KEY ("driverProfileId") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
