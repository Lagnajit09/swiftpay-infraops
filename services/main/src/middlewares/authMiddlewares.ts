import { Request, Response, NextFunction } from "express";
import { introspectSession } from "../lib/authClient";
import {
  authErrorResponse,
  errorResponse,
  ErrorType,
} from "../utils/responseFormatter";
import { logInternalError } from "../utils/errorLogger";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sid =
      (req as any).cookies?.sessionId ||
      req.headers["x-session-id"]?.toString();

    if (!sid) {
      return authErrorResponse(
        res,
        "No session found. Please signin first.",
        "Session ID not found in cookies or headers",
        { hasSessionCookie: !!(req as any).cookies?.sessionId }
      );
    }

    const user = await introspectSession(sid);

    if (!user?.userId) {
      return authErrorResponse(
        res,
        "Invalid or expired session.",
        "Session verification returned invalid user data",
        { sessionId: sid.substring(0, 10) + "..." }
      );
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error("Authentication error:", err);

    await logInternalError("Authentication middleware error", err, req, {
      hasSessionCookie: !!(req as any).cookies?.sessionId,
      hasSessionHeader: !!req.headers["x-session-id"],
    });

    return authErrorResponse(
      res,
      "Unauthorized.",
      err.message || "Authentication failed",
      { authenticated: false }
    );
  }
}
