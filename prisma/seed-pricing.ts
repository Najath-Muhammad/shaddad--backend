import { PrismaClient, VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Pricing Config...');
  
  const configs = [
    {
      vehicleType: VehicleType.DYNA,
      baseFare: 100.0,
      perKmRate: 2.5,
      perKgRate: 0.05,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.PICKUP_SMALL,
      baseFare: 50.0,
      perKmRate: 1.5,
      perKgRate: 0.02,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.PICKUP_LARGE,
      baseFare: 75.0,
      perKmRate: 2.0,
      perKgRate: 0.03,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.TRAILER,
      baseFare: 300.0,
      perKmRate: 5.0,
      perKgRate: 0.1,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.FLATBED,
      baseFare: 250.0,
      perKmRate: 4.5,
      perKgRate: 0.08,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.REFRIGERATED,
      baseFare: 200.0,
      perKmRate: 3.5,
      perKgRate: 0.06,
      commissionPercentage: 15.0,
    },
    {
      vehicleType: VehicleType.BOX_TRUCK,
      baseFare: 150.0,
      perKmRate: 3.0,
      perKgRate: 0.05,
      commissionPercentage: 15.0,
    },
  ];

  for (const config of configs) {
    await prisma.pricingConfig.upsert({
      where: { vehicleType: config.vehicleType },
      update: config,
      create: config,
    });
  }
  
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
