import { RegisterCustomerDTO } from '../dtos/RegisterCustomerDTO.js';
import { RegisterDriverDTO } from '../dtos/RegisterDriverDTO.js';
import { LoginDTO } from '../dtos/LoginDTO.js';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO.js';
import { UserResponseDTO } from '../dtos/UserResponseDTO.js';
import { AuthTokensDTO } from '../dtos/AuthTokensDTO.js';

export interface AuthResult {
  user: UserResponseDTO;
  tokens: AuthTokensDTO;
}

export interface IAuthService {
  registerCustomer(dto: RegisterCustomerDTO): Promise<AuthResult>;
  registerDriver(dto: RegisterDriverDTO): Promise<AuthResult>;
  login(dto: LoginDTO): Promise<AuthResult>;
  refreshToken(dto: RefreshTokenDTO): Promise<AuthTokensDTO>;
  logout(refreshToken: string): Promise<void>;
  getCurrentUser(userId: string): Promise<UserResponseDTO>;
}
