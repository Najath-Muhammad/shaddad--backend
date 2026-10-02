import { PrismaClient, RefreshToken, UserRole } from '@prisma/client';
import { IAuthRepository, CreateUserData } from '../interfaces/IAuthRepository.js';
import { UserWithProfiles } from '../mappers/UserResponseMapper.js';

export class AuthRepository implements IAuthRepository {
  private readonly _prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this._prisma = prismaClient;
  }

  public async findUserById(id: string): Promise<UserWithProfiles | null> {
    return this._prisma.user.findUnique({
      where: { id },
      include: {
        customerProfile: true,
        driverProfile: { include: { vehicle: true } },
      },
    });
  }

  public async findUserByPhone(phoneNumber: string): Promise<UserWithProfiles | null> {
    return this._prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        customerProfile: true,
        driverProfile: { include: { vehicle: true } },
      },
    });
  }

  public async findUserByEmail(email: string): Promise<UserWithProfiles | null> {
    return this._prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        driverProfile: { include: { vehicle: true } },
      },
    });
  }

  public async findUserByIdentifier(identifier: string): Promise<UserWithProfiles | null> {
    return this._prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { email: identifier },
        ],
      },
      include: {
        customerProfile: true,
        driverProfile: { include: { vehicle: true } },
      },
    });
  }

  public async updateUserRole(userId: string, role: any): Promise<any> {
    return this._prisma.user.update({ where: { id: userId }, data: { role } });
  }
  public async findDriverProfile(userId: string): Promise<any> {
    return this._prisma.driverProfile.findUnique({ where: { userId } });
  }
  public async createDriverProfile(userId: string): Promise<any> {
    return this._prisma.driverProfile.create({ data: { userId } });
  }

  public async createUser(data: CreateUserData): Promise<UserWithProfiles> {
    return this._prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          passwordHash: data.passwordHash,
          role: data.role,
        },
      });

      if (data.role === UserRole.CUSTOMER) {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
          },
        });
      } else if (data.role === UserRole.DRIVER) {
        await tx.driverProfile.create({
          data: {
            userId: user.id,
            nationalIdNumber: data.nationalIdNumber || null,
            licenseNumber: data.licenseNumber || null,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          customerProfile: true,
          driverProfile: { include: { vehicle: true } },
        },
      });
    });
  }

  public async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    return this._prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this._prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this._prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    await this._prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}



