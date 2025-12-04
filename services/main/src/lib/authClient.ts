import axios from "axios";
import "dotenv/config";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

// Type definitions for auth service responses
interface SessionData {
  userId: string;
  email?: string;
  number?: string;
  role?: string;
  walletID?: string;
  isAuthenticated?: true;
}

interface StructuredResponse {
  success: boolean;
  data: SessionData;
}

type LegacyResponse = SessionData;

type AuthServiceResponse = StructuredResponse | LegacyResponse;

// Type guard to check if response is structured format
function isStructuredResponse(data: any): data is StructuredResponse {
  return (
    data && typeof data === "object" && "success" in data && "data" in data
  );
}

export async function introspectSession(
  sessionId: string
): Promise<SessionData> {
  try {
    const res = await axios.post<AuthServiceResponse>(
      `${AUTH_SERVICE_URL}/api/auth/service/session/verify`,
      {}, // empty body since we're sending data via headers
      {
        headers: {
          "x-session-id": sessionId,
          "x-service-id": "main-service",
          "x-service-secret": process.env.MAIN_SERVICE_SECRET,
        },
        timeout: 5000,
      }
    );

    // Check if response has structured format
    if (res.data && typeof res.data === "object") {
      // If it's a structured response, extract data
      if (isStructuredResponse(res.data)) {
        return res.data.data;
      }

      // Fallback for legacy format
      return res.data as SessionData;
    }

    throw new Error("Invalid response format from auth service");
  } catch (error: any) {
    console.error(
      "Session verification error:",
      error.response?.data || error.message
    );

    // Check for service unavailability (network errors, timeouts, connection refused)
    if (!error.response) {
      // Network error or service unavailable
      if (error.code === "ECONNREFUSED") {
        throw new Error(
          `Auth service unavailable: Connection refused at ${AUTH_SERVICE_URL}. Please ensure the auth service is running.`
        );
      }

      if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
        throw new Error(
          `Auth service unavailable: Request timed out after ${
            error.config?.timeout || 5000
          }ms. The service may be down or experiencing high load.`
        );
      }

      if (error.code === "ENOTFOUND") {
        throw new Error(
          `Auth service unavailable: Cannot resolve hostname ${AUTH_SERVICE_URL}. Please check the AUTH_SERVICE_URL configuration.`
        );
      }

      if (error.code === "ENETUNREACH" || error.code === "EHOSTUNREACH") {
        throw new Error(
          `Auth service unavailable: Network unreachable. Please check your network connection.`
        );
      }

      // Generic network error
      throw new Error(
        `Auth service unavailable: ${
          error.message || "Network error occurred"
        }. Please verify the service is running at ${AUTH_SERVICE_URL}.`
      );
    }

    // Handle HTTP error responses
    if (error?.response?.status) {
      const status = error.response.status;

      // Service unavailable or bad gateway
      if (status === 503) {
        throw new Error(
          `Auth service unavailable (503): Service temporarily unavailable. Please try again later.`
        );
      }

      if (status === 502) {
        throw new Error(
          `Auth service unavailable (502): Bad gateway. The auth service may be down or restarting.`
        );
      }

      if (status === 504) {
        throw new Error(
          `Auth service unavailable (504): Gateway timeout. The auth service is not responding.`
        );
      }

      // Handle structured error response
      if (error.response?.data?.error) {
        const errorData = error.response.data;
        throw new Error(
          `Session verification failed (${status}): ${
            errorData.message || errorData.error.details || "Unknown error"
          }`
        );
      }

      // Handle legacy error response
      const message =
        error.response?.data?.message || "Session verification failed";
      throw new Error(`Session verification failed (${status}): ${message}`);
    }

    throw new Error("Session verification request failed");
  }
}
