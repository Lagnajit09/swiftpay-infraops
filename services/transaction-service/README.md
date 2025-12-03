# Transaction Service API Documentation

## Overview

The Transaction Service orchestrates complex financial transactions in the SwiftPay platform. It coordinates between the Payment Service and Wallet Service to handle on-ramp (deposits), off-ramp (withdrawals), and peer-to-peer transfers with atomic guarantees and reconciliation support.

**Base URL:** `/api/transaction`

**Service Authentication:** All routes (except health check) require service-to-service authentication via headers:

- `x-service-id`: Service identifier (e.g., "main-service", "auth-service")
- `x-service-secret`: Service secret key
- `x-user-id`: User ID for the operation (passed from authenticated services)

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "metadata": {
    // Optional additional context
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": {
    "code": "ERROR_CODE",
    "type": "ERROR_TYPE",
    "details": "Technical error details"
  },
  "metadata": {
    // Optional error context
  }
}
```

---

## Transaction Routes (`/api/transaction`)

### 1. Health Check

**Endpoint:** `GET /api/transaction/health`

**Description:** Check if the transaction service is running

**Authentication:** None required

**Request:**

```http
GET /api/transaction/health
```

**Success Response (200):**

```json
{
  "service": "transaction",
  "route": "transaction",
  "status": "healthy",
  "timestamp": "2025-12-03T23:27:34.123Z"
}
```

---

### 2. On-Ramp Transaction (Deposit)

**Endpoint:** `POST /api/transaction/on-ramp`

**Description:** Add money to wallet from external payment source (bank account, UPI, etc.)

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Transaction Flow:**

1. Create transaction record with PENDING status
2. Call Payment Service to process payment
3. Call Wallet Service to credit wallet
4. Update transaction status to SUCCESS

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: onramp-unique-id-123 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "walletId": "wallet_abc123",
  "amount": "50000",
  "description": "Add money to wallet",
  "currency": "INR",
  "paymentMethodId": "pm_upi_123",
  "accountDetails": {
    "upiId": "user@upi"
  },
  "metadata": {
    "source": "mobile_app",
    "deviceId": "device_xyz"
  }
}
```

**Request Body Parameters:**

- `walletId` (string, required): Target wallet ID
- `amount` (string, required): Amount in smallest currency unit (e.g., paise for INR)
- `description` (string, optional): Transaction description
- `currency` (string, optional): Currency code (default: "INR")
- `paymentMethodId` (string, optional): Payment method identifier
- `accountDetails` (object, required): Payment source details
  - `upiId` (string): UPI ID for UPI payments
  - OR `accountNumber` + `ifsc` (strings): Bank account details
- `metadata` (object, optional): Additional transaction metadata

**Success Response (201):**

```json
{
  "success": true,
  "message": "On-ramp transaction successful",
  "data": {
    "transactionId": "txn_abc123",
    "status": "SUCCESS",
    "amount": "50000",
    "currency": "INR",
    "balance": "1050000",
    "paymentMethod": "UPI",
    "referenceId": "pay_ref_xyz789",
    "ledgerEntryId": "ledger_def456"
  },
  "metadata": {
    "transactionType": "ONRAMP",
    "flow": "CREDIT"
  }
}
```

**Partial Success Response (202 - Reconciliation Needed):**

```json
{
  "success": true,
  "message": "Payment successful but wallet update failed. Transaction will be reconciled.",
  "data": {
    "transactionId": "txn_abc123",
    "ledgerEntryId": null,
    "status": "PENDING",
    "paymentReferenceId": "pay_ref_xyz789"
  },
  "metadata": {
    "needsReconciliation": true,
    "paymentStatus": "SUCCESS",
    "walletStatus": "PENDING"
  }
}
```

**Error Responses:**

**401 - Unauthorized:**

```json
{
  "success": false,
  "message": "Unauthorized! UserID is missing.",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "User ID not found in request"
  },
  "metadata": {
    "userId": "unknown"
  }
}
```

**400 - Invalid Amount:**

```json
{
  "success": false,
  "message": "Amount must be positive",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"amount\",\"message\":\"Amount must be greater than zero\"}]"
  }
}
```

**400 - Missing Account Details:**

```json
{
  "success": false,
  "message": "Account details are required",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"accountDetails\",\"message\":\"Account details are required for on-ramp transactions\"}]"
  }
}
```

**400 - Invalid Account Details:**

```json
{
  "success": false,
  "message": "Valid UPI ID or Bank account details are required",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"accountDetails\",\"message\":\"Provide either UPI ID or Bank account number with IFSC\"}]"
  }
}
```

**500 - Payment Service Error:**

```json
{
  "success": false,
  "message": "Payment processing failed",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Payment gateway timeout"
  },
  "metadata": {
    "transactionId": "txn_abc123"
  }
}
```

---

### 3. Off-Ramp Transaction (Withdrawal)

**Endpoint:** `POST /api/transaction/off-ramp`

**Description:** Withdraw money from wallet to external payment destination (bank account, UPI, etc.)

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Transaction Flow:**

1. Create transaction record with PENDING status
2. Call Payment Service to process withdrawal
3. Call Wallet Service to debit wallet
4. Update transaction status to SUCCESS

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: offramp-unique-id-456 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "walletId": "wallet_abc123",
  "amount": "25000",
  "description": "Withdraw to bank account",
  "currency": "INR",
  "paymentMethodId": "pm_bank_456",
  "accountDetails": {
    "accountNumber": "1234567890",
    "ifsc": "SBIN0001234"
  },
  "metadata": {
    "purpose": "personal_expense"
  }
}
```

**Request Body Parameters:** Same as On-Ramp

**Success Response (201):**

```json
{
  "success": true,
  "message": "Off-ramp transaction successful",
  "data": {
    "transactionId": "txn_def456",
    "status": "SUCCESS",
    "amount": "25000",
    "currency": "INR",
    "balance": "1025000",
    "paymentMethod": "BANK_TRANSFER",
    "referenceId": "pay_ref_abc123",
    "ledgerEntryId": "ledger_ghi789"
  },
  "metadata": {
    "transactionType": "OFFRAMP",
    "flow": "DEBIT"
  }
}
```

**Partial Success Response (202):** Same structure as On-Ramp

**Error Responses:** Similar to On-Ramp, plus:

**400 - Insufficient Funds (from Wallet Service):**

```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Wallet balance is insufficient for this withdrawal"
  },
  "metadata": {
    "transactionId": "txn_def456"
  }
}
```

---

### 4. Peer-to-Peer Transfer

**Endpoint:** `POST /api/transaction/p2p`

**Description:** Transfer money between two users' wallets

**Authentication:** Service authentication + Sender User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Transaction Flow:**

1. Create debit transaction record for sender (PENDING)
2. Create credit transaction record for recipient (PENDING)
3. Call Wallet Service to execute P2P transfer
4. Update both transaction records to SUCCESS

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: p2p-unique-id-789 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "recipientUserId": "456",
  "amount": "10000",
  "description": "Payment for dinner",
  "paymentMethodId": "pm_wallet"
}
```

**Request Body Parameters:**

- `recipientUserId` (string, required): Recipient's user ID
- `amount` (string, required): Amount in smallest currency unit
- `description` (string, optional): Transfer description
- `paymentMethodId` (string, optional): Payment method identifier

**Success Response (201):**

```json
{
  "success": true,
  "message": "P2P transfer successful",
  "data": {
    "transactionId": {
      "debit_transaction": "txn_sender_123",
      "credit_transaction": "txn_recipient_456"
    },
    "status": "SUCCESS",
    "amount": "10000",
    "currency": "INR",
    "senderBalance": "1015000"
  },
  "metadata": {
    "transactionType": "P2P",
    "flow": "TRANSFER"
  }
}
```

**Error Responses:**

**400 - Missing Recipient:**

```json
{
  "success": false,
  "message": "Recipient user ID is required",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"recipientUserId\",\"message\":\"Recipient user ID is required\"}]"
  }
}
```

**400 - Self Transfer:**

```json
{
  "success": false,
  "message": "Cannot transfer to yourself",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"recipientUserId\",\"message\":\"Sender and recipient cannot be the same\"}]"
  }
}
```

**500 - Wallet Service Error:**

```json
{
  "success": false,
  "message": "Insufficient funds in sender wallet",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Wallet service error details"
  },
  "metadata": {
    "transactionId": "txn_sender_123"
  }
}
```

---

## Error Codes Reference

| Code                     | Type                     | HTTP Status | Description                      |
| ------------------------ | ------------------------ | ----------- | -------------------------------- |
| `AUTHENTICATION`         | `AUTHENTICATION_ERROR`   | 401         | Authentication failed            |
| `VALIDATION`             | `VALIDATION_ERROR`       | 400         | Input validation failed          |
| `CONFLICT`               | `CONFLICT_ERROR`         | 409         | Transaction conflict or deadlock |
| `DATABASE`               | `DATABASE_ERROR`         | 503         | Database connection failed       |
| `EXTERNAL_SERVICE_ERROR` | `EXTERNAL_SERVICE_ERROR` | 500         | Payment/Wallet service failed    |
| `INTERNAL`               | `INTERNAL_ERROR`         | 500         | Internal server error            |

---

## Transaction States

### Transaction Status Flow

```
PENDING → SUCCESS
PENDING → FAILED
PENDING → PENDING (with needsReconciliation flag)
```

### Status Descriptions

- **PENDING**: Transaction created, awaiting processing
- **SUCCESS**: All steps completed successfully
- **FAILED**: Transaction failed at any step

### Reconciliation States

When a transaction is marked with `needsReconciliation: true`:

- Payment succeeded but wallet update failed (On-Ramp/Off-Ramp)
- Requires manual or automated reconciliation
- Transaction record contains full audit trail in metadata

---

## Idempotency

All transaction endpoints support idempotency to prevent duplicate transactions.

**How to Use:**

1. Generate a unique idempotency key for each transaction
2. Include it in the `x-idempotency-key` header
3. If the same key is used again, the operation will be ignored

**Example:**

```http
POST /api/transaction/on-ramp
x-idempotency-key: onramp_user123_20251203_001
```

**Duplicate Request Response:**

```json
{
  "success": true,
  "message": "Duplicate ignored (idempotent)",
  "data": {
    "idempotent": true
  },
  "metadata": {
    "duplicateRequest": true
  }
}
```

---

## Service Integration

### Payment Service Integration

The Transaction Service calls the Payment Service for:

- **On-Ramp**: `onRampPayment()` - Process incoming payment
- **Off-Ramp**: `offRampPayment()` - Process outgoing payment

**Payment Service Response:**

```json
{
  "payment": {
    "id": "pay_abc123"
  },
  "paymentMethod": "UPI",
  "referenceId": "ref_xyz789"
}
```

### Wallet Service Integration

The Transaction Service calls the Wallet Service for:

- **On-Ramp**: `creditWallet()` - Add funds to wallet
- **Off-Ramp**: `debitWallet()` - Remove funds from wallet
- **P2P**: `p2pTransfer()` - Transfer between wallets

**Wallet Service Response:**

```json
{
  "balance": "1050000",
  "ledgerEntryId": "ledger_abc123"
}
```

---

## Error Handling & Reconciliation

### Multi-Step Transaction Handling

Each transaction involves multiple services. The Transaction Service handles failures gracefully:

#### Scenario 1: Payment Fails

- Transaction status: FAILED
- No wallet changes made
- User can retry

#### Scenario 2: Payment Succeeds, Wallet Update Fails

- Transaction status: PENDING
- Metadata flag: `needsReconciliation: true`
- HTTP Status: 202 Accepted
- Requires reconciliation process

#### Scenario 3: Both Succeed

- Transaction status: SUCCESS
- HTTP Status: 201 Created
- All operations completed

### Reconciliation Process

For transactions with `needsReconciliation: true`:

1. **Automated Reconciliation** (recommended):

   - Background job checks PENDING transactions
   - Retries wallet operations
   - Updates transaction status

2. **Manual Reconciliation**:
   - Admin reviews transaction metadata
   - Manually triggers wallet credit/debit
   - Updates transaction status

**Transaction Metadata for Reconciliation:**

```json
{
  "paymentResponse": {
    /* Full payment service response */
  },
  "walletError": "Connection timeout",
  "needsReconciliation": true,
  "failedAt": "2025-12-03T23:27:34.123Z"
}
```

---

## Error Logging

The transaction service implements comprehensive error logging with structured output.

### Log Format

```
================================================================================
[2025-12-03T23:27:34.123Z] ERROR: EXTERNAL_SERVICE_ERROR
Message: Payment service error during on-ramp
Error Details:
  Name: Error
  Message: Payment gateway timeout
  Code: ETIMEDOUT
Context:
  User ID: 123
  Endpoint: POST /api/transaction/on-ramp
  IP Address: 192.168.1.1
  User Agent: Mozilla/5.0...
Metadata: {"transactionId":"txn_abc123","amount":"50000"}
Stack Trace:
Error: Payment gateway timeout
    at onRampTransaction (/path/to/onRampTxn.ts:73:15)
    ...
================================================================================
```

### Error Types Logged

1. **Validation Errors** (INFO level)

   - Invalid amounts
   - Missing required fields
   - Self-transfer attempts

2. **External Service Errors** (ERROR level)

   - Payment service failures
   - Wallet service failures
   - Service communication errors

3. **Database Errors** (ERROR level)

   - Connection failures
   - Transaction conflicts
   - Constraint violations

4. **Internal Errors** (ERROR level)
   - Unexpected exceptions
   - Operation failures

---

## Database Schema

### Transaction Table

```prisma
model Transaction {
  id                  String   @id @default(cuid())
  userId              String
  walletId            String
  amount              BigInt
  currency            String   @default("INR")
  type                String   // CREDIT or DEBIT
  flow                String   // ONRAMP, OFFRAMP, or P2P
  status              String   // PENDING, SUCCESS, FAILED
  description         String?
  paymentMethodId     String?
  ledgerReferenceId   String?
  paymentReferenceId  String?
  relatedTxnId        String?  // For P2P transactions
  idempotencyKey      String?  @unique
  metadata            Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## Rate Limiting

All routes are protected by rate limiting:

- **General Limiter**: 50 requests per 15 minutes per IP

Exceeding rate limits returns:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "type": "RATE_LIMIT_EXCEEDED_ERROR",
    "details": "General rate limit allows 50 requests per 15 minutes. Limit exceeded.",
    "retryAfter": "15 minutes"
  }
}
```

---

## Best Practices

### For Service Integrations

1. **Always use idempotency keys** for all transaction operations
2. **Handle 202 responses** - Implement reconciliation monitoring
3. **Validate amounts** before sending requests (must be positive)
4. **Store amounts as strings** to avoid precision loss
5. **Monitor transaction status** for PENDING transactions
6. **Implement retry logic** for transient failures

### For Error Handling

1. **Parse error responses** to get detailed error information
2. **Check metadata** for transaction IDs and reconciliation flags
3. **Log all transaction attempts** with idempotency keys
4. **Implement alerting** for transactions needing reconciliation

### For Testing

1. **Test idempotency** by sending duplicate requests
2. **Test partial failures** (mock payment/wallet service failures)
3. **Test reconciliation flow** with manual wallet operations
4. **Test all validation scenarios**
5. **Test concurrent transactions**

---

## Transaction Flow Diagrams

### On-Ramp Flow

```
User Request
    ↓
Create Transaction (PENDING)
    ↓
Call Payment Service
    ↓ (Success)
Call Wallet Service (Credit)
    ↓ (Success)
Update Transaction (SUCCESS)
    ↓
Return 201 Response
```

### Off-Ramp Flow

```
User Request
    ↓
Create Transaction (PENDING)
    ↓
Call Payment Service
    ↓ (Success)
Call Wallet Service (Debit)
    ↓ (Success)
Update Transaction (SUCCESS)
    ↓
Return 201 Response
```

### P2P Flow

```
User Request
    ↓
Create Debit Transaction (PENDING)
Create Credit Transaction (PENDING)
    ↓
Call Wallet Service (P2P Transfer)
    ↓ (Success)
Update Both Transactions (SUCCESS)
    ↓
Return 201 Response
```

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Transaction Success Rate**: % of SUCCESS transactions
2. **Reconciliation Rate**: % of transactions needing reconciliation
3. **Average Transaction Time**: Time from creation to completion
4. **Service Dependency Health**: Payment/Wallet service availability
5. **Error Rates by Type**: Validation, External Service, Database errors

### Alerts to Configure

1. **High Reconciliation Rate**: > 5% of transactions need reconciliation
2. **Service Downtime**: Payment or Wallet service unavailable
3. **Transaction Timeout**: Transactions stuck in PENDING > 5 minutes
4. **Database Connection Issues**: Connection pool exhaustion

---

## Support

For issues or questions, contact the SwiftPay development team.

**Last Updated:** December 3, 2025
