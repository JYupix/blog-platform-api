import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { JwtPayload } from "../modules/auth/auth.types.js";

export const generateVerificationToken = (userId: string): string => {
  return jwt.sign({ userId, type: "verification" }, ENV.JWT_SECRET, {
    expiresIn: "24h",
  });
};

export const generateAuthToken = (
  userId: string,
  email: string,
  role: string,
): string => {
  return jwt.sign({ userId, email, role, type: "auth" }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
};
