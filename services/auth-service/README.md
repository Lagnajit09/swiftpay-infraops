# Auth Service – SwiftPay

## 📌 Overview

The **Auth Service** is a standalone authentication microservice for **SwiftPay** that replaces the earlier **NextAuth**-based authentication system with a **custom email/password** workflow.  
This new system is **more flexible, framework-agnostic**, and **easier to extend** with additional security features such as token expiration, rate limiting, and environment variable validation.

---

## ✨ Why Switch from NextAuth?

Decided to migrate from **NextAuth** to a **custom auth service** because:

- **Full Control** – No dependency on NextAuth's abstractions; we manage tokens, expiration, and flows ourselves.
- **Microservices Ready** – Can be reused in multiple apps (frontend, mobile, etc.).
- **Advanced Features** – Easier integration of features like **token cleanup**, **input sanitization**, and **custom rate limiting**.
- **Improved Email Workflows** – Native email verification and password reset handling.

---

## 🔑 Features

### ✅ Implemented

1. **Custom Email/Password Authentication**
   - Secure password hashing using **bcrypt**.
   - Email verification before account activation.
2. **Verification Token System**
   - Tokens generated using `crypto.randomBytes`.
   - Tokens expire after a set period (default: **15 minutes**).
3. **Password Reset Flow**
   - Secure token-based password reset.
4. **Email Delivery via EmailJS REST API**
   - Sends verification and password reset links.

### 🛠 Security Enhancements

2. **Environment Variables Validation**  
   Validate `.env` configuration at startup to prevent missing/invalid keys.

3. **Rate Limiting**  
   Protect against brute-force attacks with request limits per IP.

4. **Input Sanitization**  
   Prevent injection attacks by cleaning and validating inputs.

5. **Logging**  
   Implement structured logging for authentication events.

6. **CORS Configuration**  
   Fine-tuned CORS rules to allow specific frontends only.

7. **Token Cleanup**  
   Automatic deletion of expired verification and password reset tokens.

---

## 📂 Project Structure

```

auth-service/
│
├── controllers/
│   ├── signup.ts              # Handles user registration & sends verification email
│   ├── emailVerification.ts   # Verifies email using token
│   ├── resetPassword.ts       # Handles password reset requests
│
├── prisma/
│   └── schema.prisma          # Database schema definition
│
├── routes/
│   ├── auth.routes.ts         # Routes for auth endpoints
│
├── utils/
│   ├── sendEmail.ts           # EmailJS REST API integration
│
└── README.md

```

---

## 🔐 Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# App
FRONTEND_URL=http://localhost:3000

# EmailJS
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_VERIFICATION_TEMPLATE_ID=your_template_id
EMAILJS_RESET_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_ID=your_public_id
EMAILJS_PRIVATE_ID=your_private_id
```

---

## 🚀 API Endpoints

### **1️⃣ Signup**

**POST** `/auth/signup`
Registers a new user and sends a verification email.

Request Body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "number": "9876543210",
  "password": "SecurePassword123"
}
```

Response:

```json
{
  "message": "User registered. Please check your email to verify your account."
}
```

---

### **2️⃣ Email Verification**

**GET** `/auth/verify-email?token=...`
Verifies a user’s email address using the token sent via email.

Response:

```json
{
  "message": "Email verified successfully."
}
```

---

### **3️⃣ Request Password Reset**

**POST** `/auth/request-password-reset`

Request Body:

```json
{
  "email": "john@example.com"
}
```

Response:

```json
{
  "message": "Password reset link sent to your email."
}
```

---

### **4️⃣ Reset Password**

**POST** `/auth/reset-password`

Request Body:

```json
{
  "token": "generated_token_here",
  "newPassword": "NewSecurePassword456"
}
```

Response:

```json
{
  "message": "Password reset successful."
}
```

---

## 🧩 Future Roadmap

- Add **Redis** support for short-lived tokens to improve performance.
- Implement **JWT-based session management**.
- Add **refresh token rotation**.
- Multi-factor authentication (MFA) support.

---
