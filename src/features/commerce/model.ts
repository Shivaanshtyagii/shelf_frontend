export type Commerce = {
  enabled: boolean; platformCommissionMinor: number;
  ledger: { reference: string; status: string; amountMinor: number; currency: string }[];
  payouts: { reference: string; status: string; amountMinor: number; currency: string }[];
};
