# Payment Service API Documentation

## Overview

The Payment Service handles payment gateway integration for the SwiftPay platform. It processes on-ramp (deposits) and off-ramp (withdrawals) transactions by interfacing with external bank systems and payment gateways. The service maintains payment records, tracks attempts, and provides idempotency guarantees.

**Base URL:** `/api/payment`

**Service Authentication:** All routes (except health check) require service-to-service authentication via headers:

- `x-service-id`: Service identifier (e.g., "transaction-service")
- `x-service-secret`: Service secret key
- `x-user-id`: User ID for the operation

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

## Payment Routes (`/api/payment`)

### 1. Health Check

**Endpoint:** `GET /api/payment/health`

**Description:** Check if the payment service is running

**Authentication:** None required

**Request:**

```http
GET /api/payment/health
```

**Success Response (200):**

```json
{
  "service": "payment",
  "route": "payment",
  "status": "healthy",
  "timestamp": "2025-12-04T22:27:15.123Z"
}
```

---

### 2. On-Ramp Payment (Deposit)

**Endpoint:** `POST /api/payment/on-ramp`

**Description:** Process incoming payment from user's bank account or UPI to collect funds

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Payment Flow:**

1. Validate request parameters
2. Check idempotency (return existing if duplicate)
3. Create payment record (PENDING status)
4. Create payment attempt record
5. Call bank gateway to process payment
6. Update payment attempt with gateway response
7. Update payment status (SUCCESS or FAILED)

**Request Headers:**

```
x-service-id: transaction-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: onramp-payment-unique-id-123 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "walletId": "wallet_abc123",
  "transactionId": "txn_xyz789",
  "paymentMethodId": "pm_upi_001",
  "amount": "50000",
  "currency": "INR",
  "accountDetails": {
    "upiId": "user@okaxis"
  },
  "metadata": {
    "source": "mobile_app",
    "deviceId": "device_123"
  }
}
```

**Request Body Parameters:**

- `walletId` (string, required): Target wallet ID
- `transactionId` (string, optional): Associated transaction ID from transaction-service
- `paymentMethodId` (string, optional): Payment method identifier
- `amount` (string, required): Amount in smallest currency unit (e.g., paise for INR)
- `currency` (string, optional): Currency code (default: "INR")
- `accountDetails` (object, required): Payment source details
  - For UPI: `upiId` (string)
  - For Bank: `accountNumber` (string) + `ifsc` (string)
  - Optional: `bankName` (string)
- `metadata` (object, optional): Additional payment metadata

**Success Response (200):**

```json
{
  "success": true,
  "message": "On-ramp payment processed successfully",
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "SUCCESS",
      "amount": 50000,
      "currency": "INR",
      "transactionId": "txn_xyz789",
      "gatewayReference": "gateway_ref_456"
    },
    "paymentMethod": "UPI",
    "referenceId": "gateway_ref_456"
  },
  "metadata": {
    "paymentType": "ONRAMP",
    "attemptNumber": 1
  }
}
```

**Idempotent Response (200):**

```json
{
  "success": true,
  "message": "Request already processed (idempotent)",
  "data": {
    "payment": {
      "id": "pay_abc123",
      "status": "SUCCESS",
      "amount": 50000,
      "currency": "INR",
      "userId": "123",
      "walletId": "wallet_abc123",
      "transactionId": "txn_xyz789",
      "gatewayReference": "gateway_ref_456",
      "createdAt": "2025-12-04T22:27:15.123Z"
    }
  },
  "metadata": {
    "idempotent": true,
    "originalStatus": "SUCCESS"
  }
}
```

**Error Responses:**

**400 - Invalid Parameters:**

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"userId\",\"message\":\"User ID is required\"},{\"field\":\"walletId\",\"message\":\"Wallet ID is required\"},{\"field\":\"amount\",\"message\":\"Valid positive amount is required\"}]"
  }
}
```

**400 - Invalid Account Details:**

```json
{
  "success": false,
  "message": "Invalid account details",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"accountDetails\",\"message\":\"Account number or UPI ID is required\"}]"
  }
}
```

**400 - Payment Gateway Failure:**

```json
{
  "success": false,
  "message": "Insufficient funds in source account",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "INSUFFICIENT_FUNDS"
  },
  "metadata": {
    "payment": {
      "id": "pay_abc123",
      "status": "FAILED",
      "amount": 50000
    },
    "errorCode": "INSUFFICIENT_FUNDS"
  }
}
```

**500 - Internal Error:**

```json
{
  "success": false,
  "message": "Internal server error during payment processing",
  "error": {
    "code": "INTERNAL",
    "type": "INTERNAL_ERROR",
    "details": "Database connection timeout"
  }
}
```

---

### 3. Off-Ramp Payment (Withdrawal)

**Endpoint:** `POST /api/payment/off-ramp`

**Description:** Process outgoing payment to user's bank account or UPI to disburse funds

**Authentication:** Service authentication + User ID required

**Idempotency:** Supported via `x-idempotency-key` header

**Payment Flow:** Same as On-Ramp

**Request Headers:**

```
x-service-id: transaction-service
x-service-secret: <service-secret>
x-user-id: 123
x-idempotency-key: offramp-payment-unique-id-456 (optional)
Content-Type: application/json
```

**Request Body:**

```json
{
  "walletId": "wallet_abc123",
  "transactionId": "txn_def456",
  "paymentMethodId": "pm_bank_002",
  "amount": "25000",
  "currency": "INR",
  "accountDetails": {
    "accountNumber": "1234567890",
    "ifsc": "SBIN0001234",
    "bankName": "State Bank of India"
  },
  "metadata": {
    "purpose": "withdrawal",
    "requestedBy": "user"
  }
}
```

**Request Body Parameters:** Same as On-Ramp

**Success Response (200):**

```json
{
  "success": true,
  "message": "Off-ramp payment processed successfully",
  "data": {
    "payment": {
      "id": "pay_def456",
      "status": "SUCCESS",
      "amount": 25000,
      "currency": "INR",
      "transactionId": "txn_def456",
      "gatewayReference": "gateway_ref_789"
    },
    "paymentMethod": "BANK_TRANSFER",
    "referenceId": "gateway_ref_789"
  },
  "metadata": {
    "paymentType": "OFFRAMP",
    "attemptNumber": 1
  }
}
```

**Error Responses:** Similar to On-Ramp, plus:

**400 - Invalid Beneficiary Account:**

```json
{
  "success": false,
  "message": "Invalid beneficiary account",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "INVALID_ACCOUNT"
  },
  "metadata": {
    "payment": {
      "id": "pay_def456",
      "status": "FAILED",
      "amount": 25000
    },
    "errorCode": "INVALID_ACCOUNT"
  }
}
```

---

## Payment Status Flow

```
PENDING → SUCCESS
PENDING → FAILED
```

### Status Descriptions

- **PENDING**: Payment initiated, awaiting gateway response
- **SUCCESS**: Payment processed successfully by gateway
- **FAILED**: Payment failed at gateway level

---

## Payment Attempt Tracking

Each payment can have multiple attempts (for retry scenarios). Each attempt records:

**Attempt Status:**

- **INITIATED**: Attempt started
- **SUCCESS**: Attempt succeeded
- **FAILED**: Attempt failed

**Attempt Data:**

```json
{
  "id": "attempt_abc123",
  "paymentId": "pay_abc123",
  "gateway": "DEMO_BANK",
  "status": "SUCCESS",
  "attemptNumber": 1,
  "rawRequest": {
    /* Original request to gateway */
  },
  "rawResponse": {
    /* Gateway response */
  },
  "errorCode": null,
  "errorMessage": null,
  "createdAt": "2025-12-04T22:27:15.123Z"
}
```

---

## Idempotency

The payment service implements idempotency using a composite key of `walletId` and `idempotencyKey`.

**How It Works:**

1. Client sends request with `x-idempotency-key` header
2. Service checks if payment exists with same `walletId` + `idempotencyKey`
3. If exists, returns existing payment record (no new payment created)
4. If not exists, processes payment normally

**Benefits:**

- Prevents duplicate payments
- Safe to retry failed requests
- Maintains payment integrity

**Example:**

```http
POST /api/payment/on-ramp
x-idempotency-key: payment_user123_20251204_001
```

If the same key is used again:

```json
{
  "success": true,
  "message": "Request already processed (idempotent)",
  "data": {
    "payment": {
      /* Existing payment record */
    }
  },
  "metadata": {
    "idempotent": true,
    "originalStatus": "SUCCESS"
  }
}
```

---

## Error Codes Reference

| Code                     | Type                        | HTTP Status | Description             |
| ------------------------ | --------------------------- | ----------- | ----------------------- |
| `VALIDATION`             | `VALIDATION_ERROR`          | 400         | Input validation failed |
| `EXTERNAL_SERVICE_ERROR` | `EXTERNAL_SERVICE_ERROR`    | 400         | Payment gateway error   |
| `RATE_LIMIT_EXCEEDED`    | `RATE_LIMIT_EXCEEDED_ERROR` | 429         | Rate limit exceeded     |
| `INTERNAL`               | `INTERNAL_ERROR`            | 500         | Internal server error   |

### Common Gateway Error Codes

| Gateway Error                | Description                             |
| ---------------------------- | --------------------------------------- |
| `INSUFFICIENT_FUNDS`         | Source account has insufficient balance |
| `INVALID_ACCOUNT`            | Account number or UPI ID is invalid     |
| `ACCOUNT_BLOCKED`            | Account is blocked or frozen            |
| `TRANSACTION_LIMIT_EXCEEDED` | Transaction exceeds allowed limit       |
| `GATEWAY_TIMEOUT`            | Gateway did not respond in time         |
| `GATEWAY_ERROR`              | Generic gateway error                   |
| `RATE_LIMIT_EXCEEDED`        | Rate limit exceeded                     |

---

## Input Sanitization

All input parameters are sanitized before processing:

**Sanitization Functions:**

- `id()`: Sanitizes user IDs, wallet IDs, transaction IDs
- `amount()`: Validates and sanitizes amount values
- `currencyCode()`: Validates currency codes (e.g., INR, USD)
- `accountNumber()`: Sanitizes bank account numbers
- `ifscCode()`: Validates and sanitizes IFSC codes
- `upiId()`: Validates UPI ID format
- `bankName()`: Sanitizes bank names
- `referenceId()`: Sanitizes reference IDs
- `metadata()`: Sanitizes metadata objects

**Example:**

```typescript
const sanitizedAmount = parseFloat(sanitizeInput.amount(amount));
const sanitizedUpiId = sanitizeInput.upiId(accountDetails.upiId);
```

---

## Error Logging

The payment service implements comprehensive error logging with structured output.

### Log Format

```
================================================================================
[2025-12-04T22:27:15.123Z] ERROR: EXTERNAL_SERVICE_ERROR
Message: Bank gateway error during on-ramp
Error Details:
  Name: Error
  Message: Payment processing failed
  Code: INSUFFICIENT_FUNDS
Context:
  User ID: 123
  Endpoint: POST /api/payment/on-ramp
  IP Address: 192.168.1.1
  User Agent: axios/1.6.0
Metadata: {"paymentId":"pay_abc123","errorCode":"INSUFFICIENT_FUNDS","gateway":"DEMO_BANK"}
Stack Trace:
Error: Payment processing failed
    at handleOnRamp (/path/to/paymentActions.ts:234:15)
    ...
================================================================================
```

### Error Types Logged

1. **Validation Errors** (INFO level)

   - Invalid parameters
   - Missing required fields
   - Invalid account details

2. **External Service Errors** (ERROR level)

   - Bank gateway failures
   - Payment processing errors
   - Gateway timeouts

3. **Internal Errors** (ERROR level)
   - Database errors
   - Unexpected exceptions
   - System failures

---

## Database Schema

### Payment Table

```prisma
model Payment {
  id                String          @id @default(cuid())
  userId            String
  walletId          String
  transactionId     String?
  paymentMethodId   String?
  amount            BigInt
  currency          String          @default("INR")
  status            PaymentStatus   @default(PENDING)
  type              PaymentType
  gatewayReference  String?
  metadata          Json?
  idempotencyKey    String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  paymentAttempts   PaymentAttempt[]

  @@unique([walletId, idempotencyKey])
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PaymentType {
  ONRAMP
  OFFRAMP
}
```

### Payment Attempt Table

```prisma
model PaymentAttempt {
  id            String        @id @default(cuid())
  paymentId     String
  gateway       String
  status        AttemptStatus @default(INITIATED)
  attemptNumber Int
  rawRequest    Json?
  rawResponse   Json?
  errorCode     String?
  errorMessage  String?
  createdAt     DateTime      @default(now())
  payment       Payment       @relation(fields: [paymentId], references: [id])
}

enum AttemptStatus {
  INITIATED
  SUCCESS
  FAILED
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

## Bank Gateway Integration

### Demo Bank Implementation

The service includes a demo bank implementation for testing:

**On-Ramp Success Simulation:**

```typescript
{
  success: true,
  transactionId: "bank_txn_123",
  gatewayReference: "gateway_ref_456",
  rawResponse: { /* Gateway response */ }
}
```

**On-Ramp Failure Simulation:**

```typescript
{
  success: false,
  errorCode: "INSUFFICIENT_FUNDS",
  errorMessage: "Insufficient funds in source account",
  rawResponse: { /* Gateway error response */ }
}
```

### Production Gateway Integration

For production, implement gateway-specific logic in:

- `src/lib/bankReq.ts`

**Required Functions:**

- `processBankOnRamp()`: Handle incoming payments
- `processBankOffRamp()`: Handle outgoing payments

**Gateway Response Format:**

```typescript
interface BankResponse {
  success: boolean;
  transactionId?: string;
  gatewayReference?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}
```

---

## Best Practices

### For Service Integrations

1. **Always use idempotency keys** for all payment operations
2. **Handle both success and failure** responses appropriately
3. **Store payment IDs** for reconciliation and tracking
4. **Validate amounts** before sending requests
5. **Monitor payment status** for PENDING payments
6. **Implement retry logic** for transient failures (with idempotency)

### For Error Handling

1. **Parse error responses** to get gateway error codes
2. **Check metadata** for payment IDs and error details
3. **Log all payment attempts** with idempotency keys
4. **Implement alerting** for high failure rates
5. **Monitor gateway health** and response times

### For Testing

1. **Test idempotency** by sending duplicate requests
2. **Test validation** with invalid parameters
3. **Test gateway failures** with mock responses
4. **Test amount limits** and edge cases
5. **Test concurrent requests** with same idempotency key

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Payment Success Rate**: % of SUCCESS payments
2. **Payment Failure Rate**: % of FAILED payments by error code
3. **Average Processing Time**: Time from request to gateway response
4. **Gateway Response Time**: Time taken by bank gateway
5. **Idempotency Hit Rate**: % of requests that are duplicates

### Alerts to Configure

1. **High Failure Rate**: > 10% of payments failing
2. **Gateway Downtime**: Gateway not responding
3. **Slow Response Time**: Gateway response > 5 seconds
4. **Database Issues**: Connection pool exhaustion
5. **Unusual Error Codes**: New or unexpected gateway errors

### Logging Best Practices

1. **Log all payment attempts** with full context
2. **Log gateway requests and responses** (sanitize sensitive data)
3. **Log idempotency checks** for debugging
4. **Log validation failures** with field details
5. **Log performance metrics** for optimization

---

## Security Considerations

### Data Sanitization

All input data is sanitized to prevent:

- SQL injection
- XSS attacks
- Invalid data formats

### Sensitive Data Handling

**Never log:**

- Full account numbers (mask: `****7890`)
- UPI PINs or passwords
- Gateway authentication tokens

**Always log:**

- Payment IDs
- Transaction IDs
- Error codes and messages
- Timestamps

### Service Authentication

All payment endpoints require:

- Valid service ID
- Valid service secret
- User ID in headers

---

## Support

For issues or questions, contact the SwiftPay development team.

**Last Updated:** December 4, 2025
