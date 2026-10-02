import { PrismaClient } from '@prisma/client';
import { AdminDashboardController } from './src/modules/admin/controllers/AdminDashboardController';

const prisma = new PrismaClient();

async function main() {
  const controller = new AdminDashboardController(prisma);
  console.log('Testing getMetrics...');
  try {
    const req = {} as any;
    const res = { json: (data: any) => console.log('Success:', data), status: (code: any) => ({ json: (data: any) => console.log('Code:', code, data) }) } as any;
    const next = (err: any) => console.error('Next called with error:', err);
    await controller.getMetrics(req, res, next);
  } catch (e) {
    console.error('Error:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
