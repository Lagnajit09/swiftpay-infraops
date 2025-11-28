export interface BankRequestParams {
  amount: bigint;
  currency: string;
  accountDetails: {
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
  transactionType: "ONRAMP" | "OFFRAMP";
  userId: string;
  walletId: string;
}

export interface BankResponse {
  success: boolean;
  transactionId?: string;
  gatewayReference?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface OnRampRequestBody {
  userId: string;
  walletId: string;
  transactionId: string;
  paymentMethodId?: string;
  amount: number; // in smallest currency unit (e.g., paise for INR)
  currency?: string;
  accountDetails: {
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
  metadata?: any;
  idempotencyKey?: string;
}

export interface OffRampRequestBody {
  userId: string;
  walletId: string;
  transactionId: string;
  paymentMethodId?: string;
  amount: number;
  currency?: string;
  accountDetails: {
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
  metadata?: any;
  idempotencyKey?: string;
}
