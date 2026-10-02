import { RefreshToken, UserRole } from '@prisma/client';
import { UserWithProfiles } from '../mappers/UserResponseMapper.js';

export interface CreateUserData {
  phoneNumber: string;
  email?: string | null;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  nationalIdNumber?: string | null;
  licenseNumber?: string | null;
}

export interface IAuthRepository {
  findUserById(id: string): Promise<UserWithProfiles | null>;
  findUserByPhone(phoneNumber: string): Promise<UserWithProfiles | null>;
  findUserByEmail(email: string): Promise<UserWithProfiles | null>;
  findUserByIdentifier(identifier: string): Promise<UserWithProfiles | null>;
  createUser(data: CreateUserData): Promise<UserWithProfiles>;
  saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
  findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  updateUserRole(userId: string, role: string): Promise<any>;
  findDriverProfile(userId: string): Promise<any>;
  createDriverProfile(userId: string): Promise<any>;
}


