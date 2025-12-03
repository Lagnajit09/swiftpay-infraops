# Wallet Service API Documentation

## Overview

The Wallet Service provides wallet management and transaction functionality for the SwiftPay platform. It handles wallet creation, credit/debit operations, and peer-to-peer transfers with atomic transaction guarantees and idempotency support.

**Base URL:** `/api/wallet`

**Service Authentication:** All routes (except health check) require service-to-service authentication via headers:

- `x-service-id`: Service identifier (e.g., "auth-service", "payment-service")
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

## Wallet Routes (`/api/wallet`)

### 1. Health Check

**Endpoint:** `GET /api/wallet/health`

**Description:** Check if the wallet service is running

**Authentication:** None required

**Request:**

```http
GET /api/wallet/health
```

**Success Response (200):**

```json
{
  "service": "wallet",
  "route": "wallet",
  "status": "healthy",
  "timestamp": "2025-12-03T19:42:45.123Z"
}
```

---

### 2. Get or Create Wallet

**Endpoint:** `GET /api/wallet/`

**Description:** Get existing wallet or create a new one for the authenticated user

**Authentication:** Service authentication + User ID required

**Request Headers:**

```
x-service-id: auth-service
x-service-secret: <service-secret>
x-user-id: 123
```

**Request:**

```http
GET /api/wallet/
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Wallet retrieved successfully",
  "data": {
    "walletId": "wallet_abc123",
    "currency": "INR",
    "balance": "1000000",
    "status": "ACTIVE"
  },
  "metadata": {
    "created": false
  }
}
```

**Notes:**

- If wallet doesn't exist, it will be created automatically
- `metadata.created` is `true` if wallet was just created, `false` if it already existed
- Balance is returned as a string to handle BigInt values

**Error Responses:**

**401 - User Not Found:**

```json
{
  "success": false,
  "message": "User not found!",
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

**500 - Internal Error:**

```json
{
  "success": false,
  "message": "Failed to get or create wallet",
  "error": {
    "code": "INTERNAL",
    "type": "INTERNAL_ERROR",
    "details": "Database error details"
  }
}
```

---

### 3. Credit Wallet

**Endpoint:** `POST /api/wallet/credit`

**Description:** Add funds to a user's wallet

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Request Headers:**

```
x-service-id: payment-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: unique-operation-id-123 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": "50000",
  "description": "Payment received from order #12345",
  "referenceId": "order_12345",
  "metaData": {
    "orderId": "12345",
    "paymentMethod": "UPI"
  }
}
```

**Request Body Parameters:**

- `amount` (string, required): Amount to credit in smallest currency unit (e.g., paise for INR)
- `description` (string, optional): Description of the transaction
- `referenceId` (string, optional): External reference ID for tracking
- `metaData` (object, optional): Additional metadata for the transaction

**Success Response (201):**

```json
{
  "success": true,
  "message": "Credit operation successful",
  "data": {
    "walletId": "wallet_abc123",
    "balance": "1050000",
    "ledgerEntryId": "ledger_xyz789"
  },
  "metadata": {
    "transactionType": "CREDIT",
    "amount": "50000"
  }
}
```

**Idempotent Response (200):**

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

**Error Responses:**

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

**404 - Wallet Not Found:**

```json
{
  "success": false,
  "message": "Wallet not found",
  "error": {
    "code": "NOT_FOUND",
    "type": "NOT_FOUND_ERROR",
    "details": "No wallet exists for this user"
  }
}
```

**403 - Wallet Not Active:**

```json
{
  "success": false,
  "message": "Wallet is not active",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "This wallet has been deactivated or suspended"
  }
}
```

**409 - Transaction Conflict:**

```json
{
  "success": false,
  "message": "Transaction conflict. Please try again.",
  "error": {
    "code": "CONFLICT",
    "type": "CONFLICT_ERROR",
    "details": "A concurrent transaction conflict occurred"
  }
}
```

**503 - Database Connection Failed:**

```json
{
  "success": false,
  "message": "Database connection failed. Please try again later.",
  "error": {
    "code": "DATABASE",
    "type": "DATABASE_ERROR",
    "details": "Database connection error details"
  }
}
```

---

### 4. Debit Wallet

**Endpoint:** `POST /api/wallet/debit`

**Description:** Deduct funds from a user's wallet

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Request Headers:**

```
x-service-id: payment-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: unique-operation-id-456 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": "25000",
  "description": "Payment for order #67890",
  "referenceId": "order_67890",
  "metaData": {
    "orderId": "67890",
    "merchantId": "merchant_123"
  }
}
```

**Request Body Parameters:**

- `amount` (string, required): Amount to debit in smallest currency unit
- `description` (string, optional): Description of the transaction
- `referenceId` (string, optional): External reference ID for tracking
- `metaData` (object, optional): Additional metadata for the transaction

**Success Response (201):**

```json
{
  "success": true,
  "message": "Debit operation successful",
  "data": {
    "walletId": "wallet_abc123",
    "balance": "1025000",
    "ledgerEntryId": "ledger_def456"
  },
  "metadata": {
    "transactionType": "DEBIT",
    "amount": "25000"
  }
}
```

**Error Responses:**

**400 - Insufficient Funds:**

```json
{
  "success": false,
  "message": "Insufficient funds",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"amount\",\"message\":\"Wallet balance is insufficient for this debit operation\"}]"
  }
}
```

**Other errors:** Same as Credit Wallet (404, 403, 409, 503, 500)

---

### 5. Peer-to-Peer Transfer

**Endpoint:** `POST /api/wallet/p2p`

**Description:** Transfer funds from one user's wallet to another user's wallet atomically

**Authentication:** Service authentication + Sender User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: unique-p2p-operation-789 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "recipientUserId": "456",
  "amount": "10000",
  "description": "Payment for dinner",
  "referenceId": {
    "debitReferenceId": "p2p_debit_123",
    "creditReferenceId": "p2p_credit_123"
  }
}
```

**Request Body Parameters:**

- `recipientUserId` (string, required): User ID of the recipient
- `amount` (string, required): Amount to transfer in smallest currency unit
- `description` (string, optional): Description of the transfer
- `referenceId` (object, optional): Reference IDs for both debit and credit entries
  - `debitReferenceId` (string): Reference for sender's debit entry
  - `creditReferenceId` (string): Reference for recipient's credit entry

**Success Response (201):**

```json
{
  "success": true,
  "message": "P2P transfer successful",
  "data": {
    "senderWallet": "wallet_abc123",
    "recipientWallet": "wallet_def456",
    "senderBalance": "1015000",
    "recipientBalance": "510000",
    "ledgerEntryId": {
      "debitLedgerEntryId": "ledger_ghi789",
      "creditLedgerEntryId": "ledger_jkl012"
    }
  },
  "metadata": {
    "transactionType": "P2P_TRANSFER",
    "amount": "10000"
  }
}
```

**Error Responses:**

**400 - Invalid Recipient:**

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

**400 - Insufficient Funds:**

```json
{
  "success": false,
  "message": "Insufficient funds",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"amount\",\"message\":\"Sender wallet balance is insufficient for this transfer\"}]"
  }
}
```

**404 - Sender Wallet Not Found:**

```json
{
  "success": false,
  "message": "Sender wallet not found",
  "error": {
    "code": "NOT_FOUND",
    "type": "NOT_FOUND_ERROR",
    "details": "No wallet exists for the sender user"
  }
}
```

**404 - Recipient Wallet Not Found:**

```json
{
  "success": false,
  "message": "Recipient wallet not found",
  "error": {
    "code": "NOT_FOUND",
    "type": "NOT_FOUND_ERROR",
    "details": "No wallet exists for the recipient user"
  }
}
```

**403 - Sender Wallet Not Active:**

```json
{
  "success": false,
  "message": "Sender wallet is not active",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "The sender's wallet has been deactivated or suspended"
  }
}
```

**403 - Recipient Wallet Not Active:**

```json
{
  "success": false,
  "message": "Recipient wallet is not active",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "The recipient's wallet has been deactivated or suspended"
  }
}
```

---

## Error Codes Reference

| Code             | Type                   | HTTP Status | Description                        |
| ---------------- | ---------------------- | ----------- | ---------------------------------- |
| `AUTHENTICATION` | `AUTHENTICATION_ERROR` | 401         | Authentication failed              |
| `AUTHORIZATION`  | `AUTHORIZATION_ERROR`  | 403         | Access denied or wallet not active |
| `VALIDATION`     | `VALIDATION_ERROR`     | 400         | Input validation failed            |
| `NOT_FOUND`      | `NOT_FOUND_ERROR`      | 404         | Wallet not found                   |
| `CONFLICT`       | `CONFLICT_ERROR`       | 409         | Transaction conflict or deadlock   |
| `RATE_LIMIT`     | `RATE_LIMIT_ERROR`     | 429         | Rate limit exceeded                |
| `DATABASE`       | `DATABASE_ERROR`       | 503         | Database connection failed         |
| `INTERNAL`       | `INTERNAL_ERROR`       | 500         | Internal server error              |

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

## Service Authentication

### Registered Services

- `main-service`
- `auth-service`
- `user-service`
- `payment-service`
- `notification-service`
- `transaction-service`

### Authentication Methods

**1. Simple Secret Authentication:**

```
x-service-id: payment-service
x-service-secret: <service-secret>
x-user-id: 123
```

**2. Signature-Based Authentication (Optional):**

```
x-service-id: payment-service
x-service-secret: <service-secret>
x-user-id: 123
x-timestamp: 1701604789123
x-signature: <hmac-sha256-signature>
```

**Signature Calculation:**

```javascript
const payload = `${serviceId}${timestamp}${JSON.stringify(requestBody)}`;
const signature = crypto
  .createHmac("sha256", serviceSecret)
  .update(payload)
  .digest("hex");
```

**Timestamp Tolerance:** 5 minutes

---

## Idempotency

All transaction endpoints (credit, debit, p2p) support idempotency to prevent duplicate operations.

**How to Use:**

1. Generate a unique idempotency key for each operation
2. Include it in the `x-idempotency-key` header
3. If the same key is used again, the operation will be ignored and return a 200 response

**Example:**

```http
POST /api/wallet/credit
x-idempotency-key: payment_12345_attempt_1
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

## Transaction Guarantees

### Atomicity

All wallet operations use database transactions to ensure atomicity:

- **Credit/Debit**: Ledger entry creation and balance update happen atomically
- **P2P Transfer**: Sender debit and recipient credit happen in a single atomic transaction

### Optimistic Concurrency Control

Wallets use version numbers to prevent lost updates:

- Each wallet has a `version` field
- Every transaction increments the version
- Concurrent updates are detected and rejected with a 409 Conflict error

### Balance Consistency

- Balance is stored as `BigInt` to handle large amounts precisely
- Balance is always returned as a string in JSON responses
- All arithmetic operations use BigInt to prevent precision loss

---

## Error Logging

The wallet service implements comprehensive error logging with structured output.

### Log Format

```
================================================================================
[2025-12-03T19:42:45.123Z] ERROR: VALIDATION_ERROR
Message: Invalid credit amount
Error Details:
  Name: Error
  Message: Amount must be positive
  Code: undefined
Context:
  User ID: 123
  Endpoint: POST /api/wallet/credit
  IP Address: 192.168.1.1
  User Agent: Mozilla/5.0...
Metadata: {"amount":"0"}
Stack Trace:
Error: Amount must be positive
    at credit (/path/to/credit.ts:40:15)
    ...
================================================================================
```

### Error Types Logged

1. **Validation Errors** (INFO level)

   - Invalid amounts
   - Missing required fields
   - Self-transfer attempts

2. **Database Errors** (ERROR level)

   - Connection failures
   - Transaction conflicts
   - Constraint violations

3. **Internal Errors** (ERROR level)
   - Unexpected exceptions
   - Operation failures

### Log Levels

- `ERROR`: Critical errors requiring immediate attention
- `WARN`: Warning-level errors (authentication failures)
- `INFO`: Informational errors (validation failures)

---

## Database Schema

### Wallet Table

```prisma
model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  balance   BigInt   @default(0)
  currency  String   @default("INR")
  status    String   @default("ACTIVE")
  version   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Ledger Entry Table

```prisma
model LedgerEntry {
  id              String   @id @default(cuid())
  walletId        String
  type            String   // CREDIT or DEBIT
  amount          BigInt
  description     String?
  referenceId     String?
  idempotencyKey  String?  @unique
  metadata        Json?
  createdAt       DateTime @default(now())
}
```

---

## Best Practices

### For Service Integrations

1. **Always use idempotency keys** for transaction operations
2. **Handle 409 Conflict errors** by retrying with exponential backoff
3. **Validate amounts** before sending requests (must be positive)
4. **Store amounts as strings** to avoid precision loss
5. **Check wallet status** before attempting operations

### For Error Handling

1. **Parse error responses** to get detailed error information
2. **Log error codes and types** for debugging
3. **Display user-friendly messages** from the `message` field
4. **Use error details** for technical debugging

### For Testing

1. **Test idempotency** by sending duplicate requests
2. **Test concurrent operations** to verify transaction handling
3. **Test insufficient funds** scenarios
4. **Test wallet status** validations

---

## Support

For issues or questions, contact the SwiftPay development team.

**Last Updated:** December 3, 2025
