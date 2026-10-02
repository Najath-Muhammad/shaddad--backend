const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const res = await prisma.$queryRawUnsafe(
      SELECT dp.*, 
             ( 6371 * acos( cos( radians(24) ) * cos( radians( dp."currentLatitude" ) ) * cos( radians( dp."currentLongitude" ) - radians(46) ) + sin( radians(24) ) * sin( radians( dp."currentLatitude" ) ) ) ) AS "distanceKm"
      FROM driver_profiles dp
      WHERE dp."availability" = 'ONLINE'
      HAVING ( 6371 * acos( cos( radians(24) ) * cos( radians( dp."currentLatitude" ) ) * cos( radians( dp."currentLongitude" ) - radians(46) ) + sin( radians(24) ) * sin( radians( dp."currentLatitude" ) ) ) ) <= 50
    );
    console.log("Success", res);
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
