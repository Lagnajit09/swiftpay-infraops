const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Types ---

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  number?: string;
  emailVerified: boolean;
  role: string;
  walletID?: string;
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

export interface WalletData {
  walletId: string;
  currency: string;
  balance: string;
  status: string;
}

export interface WalletMetadata {
  created: boolean;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: WalletData;
  metadata: WalletMetadata;
}

export const walletApi = {
  getWallet: () => apiRequest<WalletResponse>("/api/wallet/"),
};

export interface AccountDetails {
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface TransactionRequest {
  walletId?: string;
  amount: number;
  description: string;
  currency: string;
  accountDetails: AccountDetails;
}

export interface TransactionData {
  transactionId: string;
  status: string;
  amount: string;
  currency: string;
  balance: string;
  paymentMethod: string;
  referenceId: string;
  ledgerEntryId: string;
}

export interface TransactionMetadata {
  transactionType: string;
  flow: string;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: TransactionData;
  metadata: TransactionMetadata;
}

export interface P2PTransferRequest {
  recipientWalletId: string;
  amount: number;
  description?: string;
}

export interface TransactionFilters {
  walletId?: string;
  type?: string;
  flow?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TransactionSummary {
  totalTransactions: number;
  credits: { count: number; total: string };
  debits: { count: number; total: string };
  onRamp: { count: number; total: string };
  offRamp: { count: number; total: string };
  p2p: {
    received: { count: number; total: string };
    sent: { count: number; total: string };
  };
}

export interface TransactionQueryResponse {
  transactions: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface TransactionSummaryResponse {
  summary: TransactionSummary;
  recentTransactions: any[];
}

export const transactionApi = {
  addMoney: (data: TransactionRequest, idempotencyKey: string) =>
    apiRequest<TransactionResponse>("/api/transaction/add-money", {
      method: "POST",
      headers: {
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),
  withdrawMoney: (data: TransactionRequest, idempotencyKey: string) =>
    apiRequest<TransactionResponse>("/api/transaction/withdraw-money", {
      method: "POST",
      headers: {
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),
  p2pTransfer: (data: P2PTransferRequest, idempotencyKey: string) =>
    apiRequest<TransactionResponse>("/api/transaction/p2p", {
      method: "POST",
      headers: {
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),

  // Queries
  getTransactions: (filters?: TransactionFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          let finalValue = String(value);
          if (
            (key === "startDate" || key === "endDate") &&
            typeof value === "string"
          ) {
            try {
              const d = new Date(value);
              if (!isNaN(d.getTime()) && value.length === 10) {
                if (key === "endDate") {
                  finalValue = new Date(`${value}T23:59:59.999Z`).toISOString();
                } else {
                  finalValue = new Date(`${value}T00:00:00.000Z`).toISOString();
                }
              }
            } catch (e) {
              // ignore
            }
          }
          params.append(key, finalValue);
        }
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<ApiResponse<TransactionQueryResponse>>(
      `/api/transaction/all${queryString}`,
    );
  },

  getTransactionSummary: (filters?: {
    startDate?: string;
    endDate?: string;
    walletId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          let finalValue = String(value);
          if (
            (key === "startDate" || key === "endDate") &&
            typeof value === "string"
          ) {
            try {
              const d = new Date(value);
              if (!isNaN(d.getTime()) && value.length === 10) {
                if (key === "endDate") {
                  finalValue = new Date(`${value}T23:59:59.999Z`).toISOString();
                } else {
                  finalValue = new Date(`${value}T00:00:00.000Z`).toISOString();
                }
              }
            } catch (e) {
              // ignore
            }
          }
          params.append(key, finalValue);
        }
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<ApiResponse<TransactionSummaryResponse>>(
      `/api/transaction/summary${queryString}`,
    );
  },

  getTransactionById: (transactionId: string) =>
    apiRequest<ApiResponse<any>>(`/api/transaction/${transactionId}`),
};
