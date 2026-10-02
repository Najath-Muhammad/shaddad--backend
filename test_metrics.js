const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const res = await Promise.all([
      prisma.customerProfile.count(),
      prisma.driverProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.driverProfile.count({ where: { verificationStatus: 'PENDING_VERIFICATION' } }),
      prisma.trip.count({ where: { status: { in: ['ACCEPTED', 'GOING_TO_PICKUP', 'DRIVER_ARRIVED', 'CARGO_PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION'] } } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: { in: ['REJECTED', 'EXPIRED'] } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.payout.count({ where: { status: { in: ['PENDING', 'ELIGIBLE', 'PROCESSING'] } } }),
      prisma.dispute.count({ where: { status: 'OPEN' } })
    ]);
    console.log("Success", res);
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
