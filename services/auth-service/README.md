# Auth Service API Documentation

## Overview

The Auth Service provides authentication, authorization, and user account management functionality for the SwiftPay platform. All responses follow a standardized format with detailed error information.

**Base URL:** `/api/auth` (for auth routes), `/api/admin` (for admin routes), `/api/account` (for account routes), `/api/service` (for service routes)

**Service Authentication:** Most routes require service-to-service authentication via headers:

- `x-service-id`: Service identifier (e.g., "wallet-service", "payment-service")
- `x-service-secret`: Service secret key

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

## Authentication Routes (`/api/auth`)

### 1. Health Check

**Endpoint:** `GET /api/auth/health`

**Description:** Check if the auth service is running

**Authentication:** None required

**Request:**

```http
GET /api/auth/health
```

**Success Response (200):**

```json
{
  "service": "auth",
  "status": "healthy",
  "timestamp": "2025-12-03T11:39:49.123Z"
}
```

---

### 2. Sign Up

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user account

**Authentication:** Service authentication required

**Middleware:** `suspiciousIPDetection`

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "number": "1234567890"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered. Please check your email to verify your account.",
  "data": {
    "userId": 123,
    "email": "john@example.com",
    "emailVerified": false
  },
  "metadata": {
    "verificationEmailSent": true,
    "tokenExpiresIn": "15 minutes"
  }
}
```

**Error Responses:**

**400 - Email Already Registered:**

```json
{
  "success": false,
  "message": "Email already registered",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "An account with this email address already exists"
  },
  "metadata": {
    "field": "email"
  }
}
```

**500 - Email Service Failure:**

```json
{
  "success": false,
  "message": "Registration failed. Unable to send verification email. Please try again.",
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "type": "EXTERNAL_SERVICE_ERROR",
    "details": "Email service error details"
  },
  "metadata": {
    "service": "EmailJS"
  }
}
```

---

### 3. Sign In

**Endpoint:** `POST /api/auth/signin`

**Description:** Authenticate user and create session

**Authentication:** Service authentication required

**Middleware:** `suspiciousIPDetection`, `checkExistingSession`

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Signed in successfully.",
  "data": {
    "user": {
      "id": 123,
      "email": "john@example.com",
      "number": "1234567890",
      "walletID": "wallet_abc123",
      "role": "USER",
      "emailVerified": true
    }
  },
  "metadata": {
    "sessionCreated": true,
    "expiresIn": "30 days"
  }
}
```

**Cookies Set:**

- `sessionId`: HTTP-only session cookie (30 days expiration)

**Error Responses:**

**401 - Invalid Credentials:**

```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "Invalid password"
  },
  "metadata": {
    "attemptsRemaining": 3,
    "failedAttempts": 2
  }
}
```

**423 - Account Locked:**

```json
{
  "success": false,
  "message": "Account locked. Try again in 25 minutes.",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "Account locked due to multiple failed login attempts"
  },
  "metadata": {
    "lockTimeRemaining": 25,
    "lockedUntil": "2025-12-03T12:04:49.123Z"
  }
}
```

**403 - Account Deactivated:**

```json
{
  "success": false,
  "message": "Account deactivated. Contact support.",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "This account has been deactivated"
  }
}
```

---

### 4. Verify Email

**Endpoint:** `GET /api/auth/verify-email`

**Description:** Verify user email address with token

**Authentication:** Service authentication required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
```

**Query Parameters:**

```
token: <verification-token>
```

**Request:**

```http
GET /api/auth/verify-email?token=abc123def456
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email successfully verified.",
  "data": {
    "emailVerified": true
  },
  "metadata": {
    "verifiedAt": "2025-12-03T11:39:49.123Z"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid or expired token.",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "The verification token is either invalid or has expired. Please request a new verification email."
  }
}
```

---

### 5. Request Password Reset

**Endpoint:** `POST /api/auth/request-reset`

**Description:** Request password reset email

**Authentication:** Service authentication required

**Middleware:** `suspiciousIPDetection`

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "If an account with this email exists, a password reset link has been sent.",
  "metadata": {
    "emailSent": true,
    "expiresIn": "15 minutes"
  }
}
```

**Note:** Returns same response whether email exists or not (security best practice)

---

### 6. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset password using reset token

**Authentication:** Service authentication required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Content-Type: application/json
```

**Request Body:**

```json
{
  "token": "reset-token-abc123",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password reset successful. Please login with your new password.",
  "data": {
    "passwordReset": true
  },
  "metadata": {
    "sessionsInvalidated": true
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid or expired reset token",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "The password reset token is either invalid or has expired. Please request a new password reset."
  }
}
```

---

## Protected Routes (Require Authentication)

**All routes below require:**

- Service authentication headers (`x-service-id`, `x-service-secret`)
- Session cookie (`sessionId`) or session header (`x-session-id`)

---

### 7. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Description:** Change password for authenticated user

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully. Other sessions have been logged out.",
  "data": {
    "passwordChanged": true
  },
  "metadata": {
    "otherSessionsInvalidated": true
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Current password is incorrect",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "The provided current password does not match our records"
  }
}
```

---

### 8. Request Email Verification

**Endpoint:** `POST /api/auth/request-email-verification`

**Description:** Request new email verification for authenticated user

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Verification email sent successfully. Please check your inbox.",
  "metadata": {
    "emailSent": true,
    "expiresIn": "24 hours"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Email is already verified.",
  "error": {
    "code": "VALIDATION",
    "type": "VALIDATION_ERROR",
    "details": "This email address has already been verified"
  }
}
```

---

### 9. Sign Out

**Endpoint:** `POST /api/auth/signout`

**Description:** Sign out user and invalidate session

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
Content-Type: application/json
```

**Request Body (Optional):**

```json
{
  "signoutType": "USER_INITIATED"
}
```

**Signout Types:**

- `USER_INITIATED` (default)
- `SESSION_EXPIRED`
- `SECURITY_LOGOUT`
- `ALL_SESSIONS`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Signed out successfully.",
  "data": {
    "signedOut": true
  },
  "metadata": {
    "signoutType": "USER_INITIATED"
  }
}
```

**Cookies Cleared:**

- `sessionId`: Session cookie removed

---

### 10. Get Security Info

**Endpoint:** `GET /api/auth/security-info`

**Description:** Get user security information

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Security information retrieved successfully",
  "data": {
    "user": {
      "lastLoginAt": "2025-12-03T11:00:00.000Z",
      "passwordChangedAt": "2025-12-01T10:00:00.000Z",
      "twoFactorEnabled": false,
      "emailVerified": true,
      "failedLoginAttempts": 0,
      "lockedUntil": null
    },
    "activeSessions": 2,
    "recentSecurityEvents": [
      {
        "eventType": "LOGIN_SUCCESS",
        "success": true,
        "createdAt": "2025-12-03T11:00:00.000Z",
        "ipAddress": "192.168.1.1"
      }
    ]
  }
}
```

---

### 11. Get Active Sessions

**Endpoint:** `GET /api/auth/sessions`

**Description:** Get all active sessions for authenticated user

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Active sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "id": "session-id-1",
        "createdAt": "2025-12-03T11:00:00.000Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "expiresAt": "2026-01-02T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 12. Revoke Session

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Description:** Revoke a specific session

**Authentication:** Session required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
```

**URL Parameters:**

- `sessionId`: Session ID to revoke

**Request:**

```http
DELETE /api/auth/sessions/session-id-123
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "sessionRevoked": true
  }
}
```

---

## Account Routes (`/api/account`)

### 13. Health Check

**Endpoint:** `GET /api/account/health`

**Description:** Check if the account service is running

**Authentication:** None required

**Success Response (200):**

```json
{
  "service": "user-account-actions",
  "status": "healthy",
  "timestamp": "2025-12-03T11:39:49.123Z"
}
```

---

### 14. Get User Profile

**Endpoint:** `GET /api/account/me`

**Description:** Get authenticated user's profile

**Authentication:** Service authentication + Session required (via headers)

**Request Headers:**

```
x-service-id: wallet-service
x-service-secret: <service-secret>
x-user-id: 123
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": 123,
      "email": "john@example.com",
      "number": "1234567890",
      "walletID": "wallet_abc123",
      "emailVerified": true,
      "isActive": true,
      "role": "USER",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "lastLoginAt": "2025-12-03T11:00:00.000Z"
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Unauthorized: User info missing",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "User ID not found in request"
  }
}
```

---

### 15. Update User Details

**Endpoint:** `POST /api/account/update-user`

**Description:** Update user profile information

**Authentication:** Service authentication + User ID header required

**Request Headers:**

```
x-service-id: wallet-service
x-service-secret: <service-secret>
x-user-id: 123
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "John Updated Doe",
  "address": "123 Main St",
  "country": "USA",
  "state": "California",
  "dob": "1990-01-01"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully updated 5 field(s)",
  "data": {
    "user": {
      "id": 123,
      "email": "john@example.com",
      "number": "1234567890",
      "walletID": "wallet_abc123",
      "name": "John Updated Doe",
      "address": "123 Main St",
      "country": "USA",
      "state": "California",
      "dob": "1990-01-01T00:00:00.000Z",
      "emailVerified": true,
      "isActive": true,
      "role": "USER",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "lastLoginAt": "2025-12-03T11:00:00.000Z"
    }
  },
  "metadata": {
    "summary": {
      "totalFields": 5,
      "updatedFields": 5,
      "rejectedFields": 0,
      "validationErrors": 0
    }
  }
}
```

**Error Response (403):**

```json
{
  "success": false,
  "message": "Account is inactive",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "This account has been deactivated"
  }
}
```

---

## Service Routes (`/api/service`)

### 16. Health Check

**Endpoint:** `GET /api/service/health`

**Description:** Check if the session service is running

**Authentication:** None required

**Success Response (200):**

```json
{
  "message": "Session service is running",
  "success": true,
  "timestamp": "2025-12-03T11:39:49.123Z"
}
```

---

### 17. Verify Session

**Endpoint:** `POST /api/service/session/verify`

**Description:** Verify user session and get user data

**Authentication:** Service authentication + Session required

**Request Headers:**

```
x-service-id: payment-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
Content-Type: application/json
```

**Success Response (200):**

```json
{
  "message": "Session verified successfully",
  "success": true,
  "data": {
    "userId": 123,
    "email": "john@example.com",
    "number": "1234567890",
    "role": "USER",
    "walletID": "wallet_abc123",
    "isAuthenticated": true
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "No session found, please signin first.",
  "error": {
    "code": "AUTHENTICATION",
    "type": "AUTHENTICATION_ERROR",
    "details": "Session ID not found in request"
  }
}
```

---

### 18. Get Session Info

**Endpoint:** `GET /api/service/session/info`

**Description:** Get current session information

**Authentication:** Service authentication + Session required

**Request Headers:**

```
x-service-id: payment-service
x-service-secret: <service-secret>
Cookie: sessionId=<session-id>
```

**Success Response (200):**

```json
{
  "message": "Session info retrieved successfully",
  "success": true,
  "data": {
    "userId": 123,
    "email": "john@example.com",
    "role": "USER",
    "walletID": "wallet_abc123",
    "sessionActive": true
  }
}
```

---

## Admin Routes (`/api/admin`)

**All admin routes require:**

- Service authentication headers
- Admin role

---

### 19. Admin Health Check

**Endpoint:** `GET /api/admin/health`

**Description:** Check if the admin-auth service is running

**Authentication:** None required

**Success Response (200):**

```json
{
  "service": "admin-auth",
  "status": "healthy",
  "timestamp": "2025-12-03T11:39:49.123Z"
}
```

---

### 20. Get Security Metrics

**Endpoint:** `GET /api/admin/security-metrics`

**Description:** Get security metrics (admin only)

**Authentication:** Service authentication + Admin role required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 1
```

**Note:** User must have `ADMIN` role

**Success Response (200):**

```json
{
  "success": true,
  "message": "Security metrics retrieved successfully",
  "data": {
    "last24Hours": {
      "totalLogins": 1250,
      "failedLogins": 45,
      "accountLockouts": 3
    },
    "last7Days": {
      "suspiciousActivities": 12
    },
    "current": {
      "lockedAccounts": 5,
      "unverifiedAccounts": 234
    }
  }
}
```

**Error Response (403):**

```json
{
  "success": false,
  "message": "Admin access required",
  "error": {
    "code": "AUTHORIZATION",
    "type": "AUTHORIZATION_ERROR",
    "details": "This endpoint requires administrator privileges"
  }
}
```

---

### 21. Get Security Logs

**Endpoint:** `GET /api/admin/security-logs`

**Description:** Get paginated security logs (admin only)

**Authentication:** Service authentication + Admin role required

**Request Headers:**

```
x-service-id: main-service
x-service-secret: <service-secret>
x-user-id: 1
Content-Type: application/json
```

**Request Body:**

```json
{
  "page": 1,
  "limit": 10,
  "eventType": "LOGIN_ATTEMPT",
  "dateFrom": "2025-12-01T00:00:00.000Z",
  "dateTo": "2025-12-03T23:59:59.999Z"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Security logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "log-id-1",
        "userId": "123",
        "email": "john@example.com",
        "eventType": "LOGIN_ATTEMPT",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "success": true,
        "metadata": {},
        "createdAt": "2025-12-03T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 1250,
      "totalPages": 125
    }
  }
}
```

---

## Error Codes Reference

| Code                  | Type                        | HTTP Status | Description               |
| --------------------- | --------------------------- | ----------- | ------------------------- |
| `AUTHENTICATION`      | `AUTHENTICATION_ERROR`      | 401         | Authentication failed     |
| `AUTHORIZATION`       | `AUTHORIZATION_ERROR`       | 403         | Access denied             |
| `VALIDATION`          | `VALIDATION_ERROR`          | 400         | Input validation failed   |
| `NOT_FOUND`           | `NOT_FOUND_ERROR`           | 404         | Resource not found        |
| `CONFLICT`            | `CONFLICT_ERROR`            | 409         | Resource conflict         |
| `RATE_LIMIT_EXCEEDED` | `RATE_LIMIT_EXCEEDED_ERROR` | 429         | Rate limit exceeded       |
| `DATABASE`            | `DATABASE_ERROR`            | 500         | Database operation failed |
| `EXTERNAL_SERVICE`    | `EXTERNAL_SERVICE_ERROR`    | 500         | External service failed   |
| `INTERNAL`            | `INTERNAL_ERROR`            | 500         | Internal server error     |

---

## Rate Limiting

All routes are protected by rate limiting:

- **General Limiter**: 100 requests per 15 minutes per IP

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
- `user-service`
- `wallet-service`
- `payment-service`
- `notification-service`
- `transaction-service`

### Authentication Methods

**1. Simple Secret Authentication:**

```
x-service-id: wallet-service
x-service-secret: <service-secret>
```

**2. Signature-Based Authentication (Optional):**

```
x-service-id: wallet-service
x-service-secret: <service-secret>
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

## Session Management

### Session Cookie

- **Name:** `sessionId`
- **Type:** HTTP-only
- **Secure:** Yes (in production)
- **SameSite:** Strict
- **Max Age:** 30 days
- **Path:** `/`

### Session Storage

- **Redis:** Session tokens stored with TTL
- **Database:** Session records with expiration tracking

---

## Security Features

1. **Suspicious IP Detection:** Blocks IPs with suspicious activity patterns
2. **Account Lockout:** Locks accounts after 5 failed login attempts (30 min lockout)
3. **Email Verification:** Required for sensitive operations
4. **Session Invalidation:** All sessions invalidated on password change/reset
5. **Security Event Logging:** All authentication events logged
6. **Rate Limiting:** Prevents brute force attacks
7. **Service Authentication:** Prevents unauthorized service access

---

## Development vs Production

### Development Mode

- Stack traces included in error responses
- Less strict CORS policies
- Detailed error logging

### Production Mode

- Stack traces hidden
- Strict security policies
- Error details sanitized

---

## Support

For issues or questions, contact the SwiftPay development team.

**Last Updated:** December 3, 2025
