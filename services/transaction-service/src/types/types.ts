export interface WalletProxyOptions {
  userId: string;
  idempotencyKey?: string;
  serviceId?: string;
  serviceSecret?: string;
}

// Standardized success response from wallet/payment services
export interface WalletResponse {
  success: boolean;
  message: string;
  data?: {
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
    [key: string]: any; // Allow additional fields
  };
  error?: {
    code: string;
    type: string;
    details: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
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

// Standardized success response from payment service
export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId?: string;
    status?: string;
    amount?: string;
    currency?: string;
    paymentMethod?: string;
    referenceId?: string;
    payment?: any;
    [key: string]: any; // Allow additional fields
  };
  error?: {
    code: string;
    type: string;
    details: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
