export interface WalletProxyOptions {
  userId: string;
  idempotencyKey?: string;
  serviceId?: string;
  serviceSecret?: string;
}

export interface WalletResponse {
  senderWallet?: string;
  recipientWallet?: string;
  currency?: string;
  balance?: string;
  status?: string;
  ledgerEntryId?:
    | string
    | {
        debitLedgerEntryId: string;
        creditLedgerEntryId: string;
      };
  senderBalance?: string;
  recipientBalance?: string;
  message?: string;
  error?: string;
}

export interface PaymentProxyOptions {
  userId: string;
  walletId: string;
  transactionId: string;
  paymentMethodId?: string;
  amount: string | number;
  currency?: string;
  idempotencyKey?: string;
  accountDetails: {
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
    bankName?: string;
  };
  metadata?: any;
  serviceId?: string;
  serviceSecret?: string;
}

export interface PaymentResponse {
  transactionId?: string;
  status?: string;
  success?: boolean;
  amount?: string;
  currency?: string;
  paymentMethod?: string;
  referenceId?: string;
  message?: string;
  error?: string;
  payment?: any;
}
