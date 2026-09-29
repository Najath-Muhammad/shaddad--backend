import { IPayoutProvider } from '../interfaces/IPayoutProvider.js';

export class MockPayoutProvider implements IPayoutProvider {
  async processPayout(_driverId: string, _amount: number, iban: string): Promise<{ success: boolean; referenceNumber: string; error?: string }> {
    // Simulate real bank transfer
    if (!iban || iban.length < 10) {
      return { success: false, referenceNumber: '', error: 'Invalid IBAN' };
    }
    
    return {
      success: true,
      referenceNumber: `MOCK-PAYOUT-${Date.now()}`
    };
  }
}
