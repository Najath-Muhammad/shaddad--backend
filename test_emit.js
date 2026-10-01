const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const trip = await prisma.trip.findUnique({
    where: { id: '9c086907-d8c3-463e-9c24-c4798e89bcc6' },
    include: { driver: { include: { user: true } } }
  });
  console.log("Trip driver user ID:", trip.driver.userId);
}
test().finally(() => prisma.$disconnect());
