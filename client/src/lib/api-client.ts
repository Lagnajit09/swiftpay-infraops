const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Types ---

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  userId: string;
  email: string;
  name?: string;
  number?: string;
  emailVerified: boolean;
  role: string;
}

export interface Session {
  sessionId: string;
  device?: string;
  ipAddress?: string;
  lastActive?: string;
  current?: boolean;
  expiresAt?: string;
}

export interface SignInResponse {
  user: User;
  session: {
    sessionId: string;
    expiresAt: string;
  };
}

export interface SignUpResponse {
  userId: string;
  email: string;
  emailVerified: boolean;
}

export interface SecurityInfo {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: number;
}

export interface SessionsResponse {
  sessions: Session[];
}

// --- Request types ---

export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
  number: string;
}

export interface SignInRequest {
  email: string;
  password?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

// --- Client Implementation ---

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && data.message) || response.statusText;
    throw new Error(message);
  }

  return data as T;
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Essential for cookie-based auth
  });

  return handleResponse<T>(response);
};

export const authApi = {
  health: () => apiRequest<any>("/api/auth/health"),

  signUp: (data: SignUpRequest) =>
    apiRequest<ApiResponse<SignUpResponse>>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  signIn: (data: SignInRequest) =>
    apiRequest<ApiResponse<SignInResponse>>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  signOut: () =>
    apiRequest<ApiResponse<{ signedOut: boolean }>>("/api/auth/signout", {
      method: "POST",
    }),

  verifyEmail: (token: string) =>
    apiRequest<ApiResponse<{ emailVerified: boolean }>>(
      `/api/auth/verify-email?token=${token}`,
    ),

  requestPasswordReset: (email: string) =>
    apiRequest<ApiResponse<{ email: string }>>("/api/auth/request-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiRequest<ApiResponse<{ passwordReset: boolean }>>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  changePassword: (data: ChangePasswordRequest) =>
    apiRequest<ApiResponse<{ passwordChanged: boolean }>>(
      "/api/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  requestEmailVerification: () =>
    apiRequest<ApiResponse<{ email: string }>>(
      "/api/auth/request-email-verification",
      {
        method: "POST",
      },
    ),

  getSecurityInfo: () =>
    apiRequest<ApiResponse<SecurityInfo>>("/api/auth/security-info"),

  getSessions: () =>
    apiRequest<ApiResponse<SessionsResponse>>("/api/auth/sessions"),

  deleteSession: (sessionId: string) =>
    apiRequest<ApiResponse<{ sessionId: string; deleted: boolean }>>(
      `/api/auth/sessions/${sessionId}`,
      {
        method: "DELETE",
      },
    ),
};

export const userApi = {
  me: () => apiRequest<ApiResponse<{ user: User }>>("/api/user/me"),
  updateUser: (data: any) =>
    apiRequest<ApiResponse<{ user: User }>>("/api/user/update-user", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
