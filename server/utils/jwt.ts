import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "traveloop-dev-secret-change-me";

export type JwtPayload = { userId: string; email: string };

export function signToken(payload: JwtPayload, expiresIn: string = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
