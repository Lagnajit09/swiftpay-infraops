import axios from "axios";
import "dotenv/config";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export async function introspectSession(sessionId: string) {
  try {
    const res = await axios.post(
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

    // Return the user data
    return (res.data as any).data as {
      userId: string;
      email?: string;
      number?: string;
      role?: string;
      walletID?: string;
      isAuthenticated?: true;
    };
  } catch (error: any) {
    console.error(
      "Session verification error:",
      error.response?.data || error.message
    );

    if (error?.response?.status) {
      const status = error.response.status;
      const message =
        error.response?.data?.message || "Session verification failed";
      throw new Error(`Session verification failed (${status}): ${message}`);
    }

    throw new Error("Session verification request failed");
  }
}
