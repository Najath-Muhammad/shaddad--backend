import { Payout } from '@prisma/client';
import { IPayoutService } from '../interfaces/IPayoutService.js';
import { IPayoutProvider } from '../interfaces/IPayoutProvider.js';
import { IPayoutRepository } from '../interfaces/IPayoutRepository.js';
import { IDriverRepository } from '../../driver/interfaces/IDriverRepository.js';
import { AppError } from '../../../common/errors/AppError.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';

export class PayoutService implements IPayoutService {
  constructor(
    // @ts-ignore
    private readonly _payoutProvider: IPayoutProvider,
    private readonly _payoutRepository: IPayoutRepository,
    private readonly _driverRepository: IDriverRepository
  ) {}

  async createEligiblePayout(driverProfileId: string, tripId: string, amount: number): Promise<Payout> {
    const driver = await this._driverRepository.findProfileById(driverProfileId);
    if (!driver) throw new AppError('Driver not found', HttpStatusCodes.NOT_FOUND);

    // Provide a dummy IBAN for now, in a real app this comes from driver's bank details
    const iban = 'SA0000000000000000000000';

    return this._payoutRepository.createPayout({
      driverProfileId,
      tripId,
      amount,
      iban
    });
  }

  async processPayout(_payoutId: string): Promise<Payout> {
    // We would fetch the payout first, ensure it is ELIGIBLE
    // Since we don't have getPayoutById in repo yet, we can add it, or just blindly process it for MVP
    throw new Error('Not implemented fully yet');
  }

  async getDriverPayouts(driverProfileId: string): Promise<Payout[]> {
    return this._payoutRepository.getPayoutsByDriver(driverProfileId);
  }
}
