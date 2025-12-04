# Main Service (BFF) API Documentation

## Overview

The Main Service acts as a Backend-For-Frontend (BFF) layer for the SwiftPay platform. It provides a unified API gateway that proxies requests to various microservices (Auth, Wallet, Transaction) while handling cross-cutting concerns like authentication, validation, and rate limiting.

**Base URL:** `/api`

**Architecture:** API Gateway Pattern

- Validates incoming requests
- Enforces rate limiting
- Proxies requests to backend microservices
- Handles session management via cookies
- Provides structured error responses

---

## Response Format

All responses from the Main Service follow a structured format, either from the service itself or proxied from backend services.

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

## Authentication

The Main Service uses **session-based authentication** with HTTP-only cookies.

### How It Works:

1. User signs in via `/api/auth/signin`
2. Auth service creates session and returns cookie
3. Main service forwards cookie to client
4. Client includes cookie in subsequent requests
5. Main service validates session and proxies to backend services

### Authentication Headers:

```
Cookie: session=<session-token>
```

For authenticated routes, the Main Service:

- Validates the session cookie
- Extracts user information
- Forwards `x-user-id` header to backend services

---

## API Routes

### Auth Routes (`/api/auth`)

All authentication-related operations are proxied to the Auth Service.

#### 1. Health Check

**Endpoint:** `GET /api/auth/health`

**Description:** Check if auth service is available

**Authentication:** None

**Request:**

```http
GET /api/auth/health
```

**Response (200):**

```json
{
  "service": "auth",
  "route": "auth",
  "status": "healthy",
  "timestamp": "2025-12-04T22:42:25.123Z"
}
```

---

#### 2. Sign Up

**Endpoint:** `POST /api/auth/signup`

**Description:** Create a new user account

**Authentication:** None

**Rate Limit:** 3 requests per hour per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "number": "+919876543210"
}
```

**Request Body Parameters:**

- `email` (string, required): User's email address
- `password` (string, required): Strong password (min 8 chars, uppercase, lowercase, number, special char)
- `number` (string, required): Phone number with country code

**Success Response (201):**

```json
{
  "success": true,
  "message": "User created successfully. Please verify your email.",
  "data": {
    "userId": "user_abc123",
    "email": "user@example.com",
    "emailVerified": false
  }
}
```

**Error Responses:**

**400 - Validation Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "[{\"field\":\"body.email\",\"message\":\"Invalid email format\"},{\"field\":\"body.password\",\"message\":\"Password must be at least 8 characters\"}]"
  }
}
```

**429 - Rate Limit:**

```json
{
  "success": false,
  "message": "Too many signup attempts. Please try again in 1 hour.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "type": "RATE_LIMIT_EXCEEDED_ERROR",
    "details": "Rate limit: 3 requests per hour"
  }
}
```

---

#### 3. Sign In

**Endpoint:** `POST /api/auth/signin`

**Description:** Authenticate user and create session

**Authentication:** None

**Rate Limit:** 3 requests per 15 minutes per IP + email combination

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Signin successful",
  "data": {
    "user": {
      "userId": "user_abc123",
      "email": "user@example.com",
      "emailVerified": true,
      "role": "USER"
    },
    "session": {
      "sessionId": "session_xyz789",
      "expiresAt": "2025-12-11T22:42:25.123Z"
    }
  }
}
```

**Response Headers:**

```
Set-Cookie: session=<session-token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

**Error Responses:**

**401 - Invalid Credentials:**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "Email or password is incorrect"
  }
}
```

---

#### 4. Email Verification

**Endpoint:** `GET /api/auth/verify-email`

**Description:** Verify user's email address

**Authentication:** None

**Rate Limit:** 5 requests per 15 minutes per IP

**Query Parameters:**

- `token` (string, required): Email verification token

**Request:**

```http
GET /api/auth/verify-email?token=<verification-token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "emailVerified": true
  }
}
```

---

#### 5. Request Password Reset

**Endpoint:** `POST /api/auth/request-reset`

**Description:** Request password reset link

**Authentication:** None

**Rate Limit:** 3 requests per hour per IP + email combination

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "email": "user@example.com"
  }
}
```

---

#### 6. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using reset token

**Authentication:** None

**Rate Limit:** 3 requests per hour per IP

**Request Body:**

```json
{
  "token": "<reset-token>",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "passwordReset": true
  }
}
```

---

#### 7. Change Password (Protected)

**Endpoint:** `POST /api/auth/change-password`

**Description:** Change password for authenticated user

**Authentication:** Required (session cookie)

**Rate Limit:** 50 requests per 15 minutes

**Request Headers:**

```
Cookie: session=<session-token>
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "passwordChanged": true
  }
}
```

---

#### 8. Request Email Verification (Protected)

**Endpoint:** `POST /api/auth/request-email-verification`

**Description:** Request new email verification link

**Authentication:** Required

**Rate Limit:** 50 requests per 15 minutes

**Success Response (200):**

```json
{
  "success": true,
  "message": "Verification email sent",
  "data": {
    "email": "user@example.com"
  }
}
```

---

#### 9. Sign Out (Protected)

**Endpoint:** `POST /api/auth/signout`

**Description:** End user session

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Signout successful",
  "data": {
    "signedOut": true
  }
}
```

**Response Headers:**

```
Set-Cookie: session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

---

#### 10. Get Security Info (Protected)

**Endpoint:** `GET /api/auth/security-info`

**Description:** Get user's security information

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Security information retrieved",
  "data": {
    "twoFactorEnabled": false,
    "lastPasswordChange": "2025-11-04T10:30:00.000Z",
    "activeSessions": 2
  }
}
```

---

#### 11. Get Sessions (Protected)

**Endpoint:** `GET /api/auth/sessions`

**Description:** Get all active sessions for user

**Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Sessions retrieved",
  "data": {
    "sessions": [
      {
        "sessionId": "session_xyz789",
        "device": "Chrome on Windows",
        "ipAddress": "192.168.1.1",
        "lastActive": "2025-12-04T22:42:25.123Z",
        "current": true
      }
    ]
  }
}
```

---

#### 12. Delete Session (Protected)

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Description:** Terminate a specific session

**Authentication:** Required

**URL Parameters:**

- `sessionId` (string, required): Session ID to delete

**Request:**

```http
DELETE /api/auth/sessions/session_xyz789
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Session deleted successfully",
  "data": {
    "sessionId": "session_xyz789",
    "deleted": true
  }
}
```

---

### User Routes (`/api/user`)

User profile management routes (all require authentication).

#### 1. Get User Profile

**Endpoint:** `GET /api/user/me`

**Description:** Get current user's profile

**Authentication:** Required

**Rate Limit:** 50 requests per 15 minutes

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "userId": "user_abc123",
    "email": "user@example.com",
    "number": "+919876543210",
    "emailVerified": true,
    "role": "USER",
    "walletID": "wallet_def456",
    "createdAt": "2025-11-01T10:00:00.000Z"
  }
}
```

---

#### 2. Update User Profile

**Endpoint:** `POST /api/user/update-user`

**Description:** Update user profile information

**Authentication:** Required

**Rate Limit:** 10 requests per 15 minutes

**Request Body:**

```json
{
  "number": "+919876543211"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile updated",
  "data": {
    "userId": "user_abc123",
    "number": "+919876543211",
    "updated": true
  }
}
```

---

### Wallet Routes (`/api/wallet`)

Wallet management routes (all require authentication).

#### 1. Health Check

**Endpoint:** `GET /api/wallet/health`

**Description:** Check if wallet service is available

**Authentication:** None

**Rate Limit:** 50 requests per 15 minutes

**Response (200):**

```json
{
  "service": "wallet",
  "route": "wallet",
  "status": "healthy",
  "timestamp": "2025-12-04T22:42:25.123Z"
}
```

---

#### 2. Get or Create Wallet

**Endpoint:** `GET /api/wallet/`

**Description:** Get user's wallet or create if doesn't exist

**Authentication:** Required

**Rate Limit:** 50 requests per 15 minutes

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

---

### Transaction Routes (`/api/transaction`)

Transaction management routes (all require authentication).

#### 1. Health Check

**Endpoint:** `GET /api/transaction/health`

**Description:** Check if transaction service is available

**Authentication:** None

**Rate Limit:** 50 requests per 15 minutes

**Response (200):**

```json
{
  "service": "transaction",
  "route": "transaction",
  "status": "healthy",
  "timestamp": "2025-12-04T22:42:25.123Z"
}
```

---

#### 2. Peer-to-Peer Transfer

**Endpoint:** `POST /api/transaction/p2p`

**Description:** Transfer money to another user

**Authentication:** Required

**Rate Limit:** 20 requests per 15 minutes per user

**Request Headers:**

```
Cookie: session=<session-token>
idempotency-key: p2p-unique-id-123 (optional)
```

**Request Body:**

```json
{
  "recipientUserId": "user_def456",
  "amount": "10000",
  "description": "Payment for dinner"
}
```

**Request Body Parameters:**

- `recipientUserId` (string, required): Recipient's user ID
- `amount` (string, required): Amount in smallest currency unit (paise)
- `description` (string, optional): Transfer description

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
    "senderBalance": "990000"
  },
  "metadata": {
    "transactionType": "P2P",
    "flow": "TRANSFER"
  }
}
```

---

#### 3. Add Money (On-Ramp)

**Endpoint:** `POST /api/transaction/add-money`

**Description:** Add money to wallet from bank account

**Authentication:** Required

**Rate Limit:** 20 requests per 30 minutes per user

**Request Headers:**

```
Cookie: session=<session-token>
idempotency-key: onramp-unique-id-456 (optional)
```

**Request Body:**

```json
{
  "amount": "50000",
  "description": "Add money to wallet",
  "currency": "INR",
  "accountDetails": {
    "upiId": "user@okaxis"
  }
}
```

**Request Body Parameters:**

- `amount` (string, required): Amount in paise
- `description` (string, optional): Transaction description
- `currency` (string, optional): Currency code (default: "INR")
- `accountDetails` (object, required): Payment source
  - For UPI: `upiId` (string)
  - For Bank: `accountNumber` (string) + `ifsc` (string)

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

---

#### 4. Withdraw Money (Off-Ramp)

**Endpoint:** `POST /api/transaction/withdraw-money`

**Description:** Withdraw money from wallet to bank account

**Authentication:** Required

**Rate Limit:** 20 requests per 30 minutes per user

**Request Headers:**

```
Cookie: session=<session-token>
idempotency-key: offramp-unique-id-789 (optional)
```

**Request Body:**

```json
{
  "amount": "25000",
  "description": "Withdraw to bank",
  "currency": "INR",
  "accountDetails": {
    "accountNumber": "1234567890",
    "ifsc": "SBIN0001234"
  }
}
```

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

---

## Error Codes Reference

| Code                     | Type                        | HTTP Status | Description             |
| ------------------------ | --------------------------- | ----------- | ----------------------- |
| `VALIDATION`             | `VALIDATION_ERROR`          | 400         | Input validation failed |
| `AUTHENTICATION`         | `AUTHENTICATION_ERROR`      | 401         | Authentication failed   |
| `AUTHORIZATION`          | `AUTHORIZATION_ERROR`       | 403         | Access denied           |
| `NOT_FOUND`              | `NOT_FOUND_ERROR`           | 404         | Resource not found      |
| `CONFLICT`               | `CONFLICT_ERROR`            | 409         | Transaction conflict    |
| `RATE_LIMIT_EXCEEDED`    | `RATE_LIMIT_EXCEEDED_ERROR` | 429         | Rate limit exceeded     |
| `EXTERNAL_SERVICE_ERROR` | `EXTERNAL_SERVICE_ERROR`    | 500/503/504 | Backend service error   |
| `INTERNAL`               | `INTERNAL_ERROR`            | 500         | Internal server error   |

---

## Rate Limiting

The Main Service implements comprehensive rate limiting to prevent abuse.

### Rate Limit Configurations

| Endpoint Pattern              | Limit | Window | Key          |
| ----------------------------- | ----- | ------ | ------------ |
| `/auth/signin`                | 3     | 15 min | IP + Email   |
| `/auth/signup`                | 3     | 1 hour | IP           |
| `/auth/request-reset`         | 3     | 1 hour | IP + Email   |
| `/auth/verify-email`          | 5     | 15 min | IP           |
| `/user/update-user`           | 10    | 15 min | IP           |
| `/transaction/p2p`            | 20    | 15 min | IP + User ID |
| `/transaction/add-money`      | 20    | 30 min | IP + User ID |
| `/transaction/withdraw-money` | 20    | 30 min | IP + User ID |
| General (all other routes)    | 50    | 15 min | IP           |

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "type": "RATE_LIMIT_EXCEEDED_ERROR",
    "details": "Rate limit: 3 requests per 15 minutes"
  }
}
```

**Response Headers:**

```
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1733345745
Retry-After: 900
```

---

## Service Proxy Errors

When backend services are unavailable or timeout:

### Service Unavailable (503)

```json
{
  "success": false,
  "message": "Service unavailable",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Cannot connect to auth service at http://localhost:5001"
  },
  "metadata": {
    "service": "auth",
    "details": "Cannot connect to auth service at http://localhost:5001"
  }
}
```

### Service Timeout (504)

```json
{
  "success": false,
  "message": "Request timeout",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Service took too long to respond"
  },
  "metadata": {
    "service": "wallet",
    "details": "Service took too long to respond"
  }
}
```

---

## Environment Variables

Required environment variables:

```env
# Service URLs
AUTH_SERVICE_URL=http://localhost:5001
WALLET_SERVICE_URL=http://localhost:5002
TRANSACTION_SERVICE_URL=http://localhost:5003

# Service Authentication
MAIN_SERVICE_SECRET=your-main-service-secret

# Server Configuration
PORT=5000
NODE_ENV=production
```

---

## Request Flow

### Typical Request Flow:

1. **Client Request** → Main Service
2. **Rate Limiting** → Check if within limits
3. **Validation** → Validate request schema
4. **Authentication** → Verify session cookie (if protected route)
5. **Proxy** → Forward to backend service with:
   - `x-service-id`: "main-service"
   - `x-service-secret`: Service secret
   - `x-user-id`: User ID (if authenticated)
   - `idempotency-key`: Idempotency key (if provided)
6. **Response** → Forward backend response to client

---

## Best Practices

### For Frontend Integrations

1. **Always include session cookie** for protected routes
2. **Handle rate limit errors** gracefully with retry logic
3. **Use idempotency keys** for transaction operations
4. **Parse structured errors** to display user-friendly messages
5. **Monitor response status codes** for proper error handling

### For Error Handling

1. **Check `success` field** in response
2. **Display `message` field** to users
3. **Log `error.details`** for debugging
4. **Handle specific error codes** appropriately
5. **Implement retry logic** for 503/504 errors

### For Security

1. **Never expose session tokens** in logs
2. **Use HTTPS** in production
3. **Set secure cookie flags** (HttpOnly, Secure, SameSite)
4. **Validate all input** on frontend before sending
5. **Implement CSRF protection** for state-changing operations

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Request Rate**: Requests per second
2. **Error Rate**: % of failed requests
3. **Response Time**: Average latency
4. **Rate Limit Hits**: % of requests rate limited
5. **Service Health**: Backend service availability

### Logging

All errors are logged with structured format including:

- Timestamp
- Error type and severity
- Request context (endpoint, method, IP, user agent)
- Error details and stack trace
- Metadata (service, user ID, etc.)

---

## Support

For issues or questions, contact the SwiftPay development team.

**Last Updated:** December 4, 2025
