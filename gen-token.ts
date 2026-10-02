import { TokenService } from './src/modules/auth/services/TokenService';
const tokenService = new TokenService();
const token = tokenService.generateAccessToken({
  userId: 'c36cd0ed-7073-4ebd-a03f-c35112af8acc',
  role: 'ADMIN',
  phoneNumber: '+966500000000',
  email: 'admin@shaddad.sa'
});
console.log(token);
