import { UserRoleType } from '../constants/AppConstants.js';

export interface AuthenticatedUserPayload {
  userId: string;
  role: UserRoleType;
  phoneNumber: string;
  email?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}
