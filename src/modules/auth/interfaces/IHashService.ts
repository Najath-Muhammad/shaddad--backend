export interface IHashService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  hashToken(token: string): string;
}
