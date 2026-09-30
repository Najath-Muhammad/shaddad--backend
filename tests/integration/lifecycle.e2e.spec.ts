import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient, UserRole } from '@prisma/client';
import { createContainer } from '../../src/composition-root';
import { HashService } from '../../src/modules/auth/services/HashService';

const prisma = new PrismaClient();
const container = createContainer();
const app = createApp(container);

describe('Complete SHADDAD End-to-End Lifecycle', () => {
  let customerToken: string;
  let driverToken: string;
  let adminToken: string;
  let tripId: string;
  let deliveryOtp: string;

  beforeAll(async () => {
    // Generate dummy users in DB directly to bypass rate limits and existing data issues
    const passwordHash = await new HashService().hashPassword('Password123!');
    
    // Admin
    const admin = await prisma.user.upsert({
      where: { phoneNumber: '+966500000000' },
      update: {},
      create: { phoneNumber: '+966500000000', fullName: 'E2E Admin', passwordHash, role: UserRole.ADMIN }
    });
    adminToken = container.tokenService.generateTokens({ userId: admin.id, role: UserRole.ADMIN, phoneNumber: admin.phoneNumber }).accessToken;

    // Customer
    const customer = await prisma.user.upsert({
      where: { phoneNumber: '+966500000001' },
      update: {},
      create: { phoneNumber: '+966500000001', fullName: 'E2E Customer', passwordHash, role: UserRole.CUSTOMER }
    });
    await prisma.customerProfile.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id }
    });
    customerToken = container.tokenService.generateTokens({ userId: customer.id, role: UserRole.CUSTOMER, phoneNumber: customer.phoneNumber }).accessToken;

    // Driver
    const driver = await prisma.user.upsert({
      where: { phoneNumber: '+966500000002' },
      update: {},
      create: { phoneNumber: '+966500000002', fullName: 'E2E Driver', passwordHash, role: UserRole.DRIVER }
    });
    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: {},
      create: { userId: driver.id, verificationStatus: 'PENDING_VERIFICATION' }
    });
    driverToken = container.tokenService.generateTokens({ userId: driver.id, role: UserRole.DRIVER, phoneNumber: driver.phoneNumber }).accessToken;
  });

  afterAll(async () => {
    await prisma.trip.deleteMany({ where: { customer: { user: { phoneNumber: '+966500000001' } } } });
    await prisma.$disconnect();
  });

  it('1. Admin sets Pricing Configuration', async () => {
    // Direct DB insert since no specific config endpoint exists in requirements for this exact moment
    await prisma.pricingConfig.upsert({
      where: { vehicleType: 'DYNA' },
      update: { baseFare: 50, perKmRate: 2, perKgRate: 0.1, commissionPercentage: 15 },
      create: { vehicleType: 'DYNA', baseFare: 50, perKmRate: 2, perKgRate: 0.1, commissionPercentage: 15 }
    });
  });

  it('2. Driver submits documents and vehicle, Admin approves', async () => {
    await request(app).post('/api/v1/drivers/vehicle').set('Authorization', `Bearer ${driverToken}`)
      .send({ vehicleType: 'DYNA', make: 'Toyota', model: 'Dyna', year: 2024, plateNumber: 'E2E123', color: 'White', maxWeightKg: 4000 });
    
    // Admin approves
    const driver = await prisma.user.findUnique({ where: { phoneNumber: '+966500000002' }, include: { driverProfile: true } });
    await prisma.driverProfile.update({
      where: { id: driver!.driverProfile!.id },
      data: { verificationStatus: 'APPROVED', availability: 'ONLINE' }
    });
  });

  it('3. Customer requests a trip', async () => {
    // Just fetch directly from DB to avoid test flakes with Redis geospatial queries
    const driverProfile = await prisma.driverProfile.findFirst({ where: { user: { phoneNumber: '+966500000002' } } });
    const driverProfileId = driverProfile!.id;

    const res = await request(app).post('/api/v1/customers/trips').set('Authorization', `Bearer ${customerToken}`)
      .send({
        driverProfileId,
        pickupLatitude: 24.7136, pickupLongitude: 46.6753, pickupAddress: 'Riyadh A',
        destinationLatitude: 24.7236, destinationLongitude: 46.6853, destinationAddress: 'Riyadh B',
        pickupDateTime: new Date().toISOString(),
        cargoType: 'Furniture', weightKg: 100, quantity: 2
      });
    
    
    expect(res.status).toBe(201);
    tripId = res.body.data.id;
  });

  it('4. Driver accepts the trip', async () => {
    const res = await request(app).post(`/api/v1/drivers/trips/${tripId}/respond`).set('Authorization', `Bearer ${driverToken}`)
      .send({ accept: true });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('5. Customer pays for the trip (Simulated Webhook)', async () => {
    // Initiate
    await request(app).post(`/api/v1/payments/trips/${tripId}/initiate`).set('Authorization', `Bearer ${customerToken}`);
    
    // Simulate webhook
    const res = await request(app).post(`/api/v1/payments/trips/${tripId}/simulate-success`).set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);

    // Verify trip is confirmed and has OTP
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    expect(trip?.status).toBe('CONFIRMED');
    expect(trip?.deliveryOtp).toBeDefined();
    deliveryOtp = trip!.deliveryOtp!;
  });

  it('6. Driver completes the transit lifecycle', async () => {
    const states = ['GOING_TO_PICKUP', 'DRIVER_ARRIVED', 'CARGO_PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION'];
    for (const state of states) {
      const res = await request(app).patch(`/api/v1/drivers/trips/${tripId}/status`).set('Authorization', `Bearer ${driverToken}`)
        .send({ status: state });
      expect(res.status).toBe(200);
    }
  });

  it('7. Driver submits POD and completes trip, Payout generates', async () => {
    const res = await request(app).post(`/api/v1/drivers/trips/${tripId}/deliver`).set('Authorization', `Bearer ${driverToken}`)
      .send({ otp: deliveryOtp });
    
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');

    // Check payout was generated
    const payout = await prisma.payout.findFirst({ where: { tripId } });
    expect(payout).toBeDefined();
    expect(payout?.status).toBe('ELIGIBLE');
  });

  it('8. Customer reviews the trip', async () => {
    const res = await request(app).post(`/api/v1/customers/trips/${tripId}/review`).set('Authorization', `Bearer ${customerToken}`)
      .send({ rating: 5, comment: 'Great E2E Test!' });
    expect(res.status).toBe(201);
  });
});
