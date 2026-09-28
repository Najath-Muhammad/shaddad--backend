import { z } from 'zod';
import { DriverVerificationStatus } from '../../../common/constants/AppConstants.js';

export const VerifyDriverSchema = z.object({
  decision: z.enum([
    DriverVerificationStatus.APPROVED,
    DriverVerificationStatus.REJECTED,
    DriverVerificationStatus.SUSPENDED,
  ]),
  reason: z.string().max(500).optional(),
});

export type VerifyDriverDTO = z.infer<typeof VerifyDriverSchema>;
