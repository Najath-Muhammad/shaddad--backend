import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@shaddad.sa';
  const adminPhone = '+966500000000';
  const defaultPassword = 'AdminPassword123';

  console.log('🌱 Seeding initial admin user...');

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { phoneNumber: adminPhone }],
    },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const admin = await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: adminEmail,
        phoneNumber: adminPhone,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.log(`✅ Admin user created successfully with ID: ${admin.id}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Phone: ${adminPhone}`);
    console.log(`   Password: ${defaultPassword}`);
    } else {
    console.log('Admin user already exists.');
  }

  console.log('Seeding pricing configurations...');
  const vehicleTypes = [
    { type: 'DYNA', baseFare: 50, perKmRate: 2, perKgRate: 0.5, commissionPercentage: 10 },
    { type: 'PICKUP_SMALL', baseFare: 30, perKmRate: 1.5, perKgRate: 0.3, commissionPercentage: 10 },
    { type: 'PICKUP_LARGE', baseFare: 40, perKmRate: 1.8, perKgRate: 0.4, commissionPercentage: 10 },
    { type: 'TRAILER', baseFare: 200, perKmRate: 5, perKgRate: 1, commissionPercentage: 15 },
    { type: 'FLATBED', baseFare: 150, perKmRate: 4, perKgRate: 0.8, commissionPercentage: 15 },
    { type: 'REFRIGERATED', baseFare: 100, perKmRate: 3, perKgRate: 0.6, commissionPercentage: 12 },
    { type: 'BOX_TRUCK', baseFare: 80, perKmRate: 2.5, perKgRate: 0.5, commissionPercentage: 12 },
  ];

  for (const v of vehicleTypes) {
    await prisma.pricingConfig.upsert({
      where: { vehicleType: v.type as any },
      update: {}, 
      create: {
        vehicleType: v.type as any,
        baseFare: v.baseFare,
        perKmRate: v.perKmRate,
        perKgRate: v.perKgRate,
        commissionPercentage: v.commissionPercentage,
        isActive: true
      }
    });
  }
  console.log('Pricing configurations seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

