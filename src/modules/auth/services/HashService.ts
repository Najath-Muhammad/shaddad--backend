import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IHashService } from '../interfaces/IHashService.js';
import { AppConstants } from '../../../common/constants/AppConstants.js';

export class HashService implements IHashService {
  private readonly _saltRounds: number;

  constructor(saltRounds: number = AppConstants.PASSWORD_SALT_ROUNDS) {
    this._saltRounds = saltRounds;
  }

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this._saltRounds);
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
