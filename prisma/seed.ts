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
    console.log('ℹ️ Admin user already exists. Skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
