export interface IPayoutProvider {
  processPayout(driverId: string, amount: number, iban: string): Promise<{ success: boolean; referenceNumber: string; error?: string }>;
}
