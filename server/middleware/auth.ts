import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthedRequest = Request & { userId?: string; userEmail?: string };

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.userId = payload.userId;
      req.userEmail = payload.email;
    } catch {
      /* ignore */
    }
  }
  next();
}
