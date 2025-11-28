// Demo bank request handler - simulates bank API interactions

import { BankRequestParams, BankResponse } from "../types/types";

/**
 * Demo function to simulate bank API request for on-ramp (money in)
 */
export async function processBankOnRamp(
  params: BankRequestParams
): Promise<BankResponse> {
  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Demo: Always return success for valid requests
  if (params.amount <= 0) {
    return {
      success: false,
      errorCode: "INVALID_AMOUNT",
      errorMessage: "Amount must be greater than zero",
      rawResponse: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  // Simulate successful bank debit and credit to SwiftPay
  return {
    success: true,
    gatewayReference: `BANK_REF_${Date.now()}`,
    rawResponse: {
      bankName: params.accountDetails.bankName || "DEMO_BANK",
      accountNumber: params.accountDetails.accountNumber,
      amount: params.amount.toString(),
      currency: params.currency,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

/**
 * Demo function to simulate bank API request for off-ramp (money out)
 */
export async function processBankOffRamp(
  params: BankRequestParams
): Promise<BankResponse> {
  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Demo: Always return success for valid requests
  if (params.amount <= 0) {
    return {
      success: false,
      errorCode: "INVALID_AMOUNT",
      errorMessage: "Amount must be greater than zero",
      rawResponse: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  // Check if account details are provided
  if (!params.accountDetails.accountNumber && !params.accountDetails.upiId) {
    return {
      success: false,
      errorCode: "MISSING_ACCOUNT_DETAILS",
      errorMessage: "Account number or UPI ID is required for withdrawal",
      rawResponse: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };
  }

  // Simulate successful credit to user's bank account
  return {
    success: true,
    gatewayReference: `BANK_REF_${Date.now()}`,
    rawResponse: {
      bankName: params.accountDetails.bankName || "DEMO_BANK",
      accountNumber: params.accountDetails.accountNumber,
      upiId: params.accountDetails.upiId,
      amount: params.amount.toString(),
      currency: params.currency,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

/**
 * Helper function to generate unique request IDs
 */
function generateRequestId(): string {
  return `REQ_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
}

/**
 * Demo function to check bank transaction status
 */
export async function checkBankTransactionStatus(
  gatewayReference: string
): Promise<BankResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    gatewayReference,
    rawResponse: {
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
    },
  };
}
