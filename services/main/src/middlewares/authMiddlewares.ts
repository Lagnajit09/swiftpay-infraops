import { Request, Response, NextFunction } from "express";
import { introspectSession } from "../lib/authClient";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sid =
      (req as any).cookies?.sessionId ||
      req.headers["x-session-id"]?.toString();
    if (!sid)
      return res
        .status(401)
        .json({ error: "No session found. Please signin first." });

    const user = await introspectSession(sid);
    if (!user?.userId)
      return res.status(401).json({ error: "Invalid or expired session." });

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: "Unauthorized." });
  }
}
