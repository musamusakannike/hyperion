import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config";
import type { UserRole } from "../models/user.model";

export const signAccessToken = (userId: string, role: UserRole): string => {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, role }, env.jwtSecret, options);
};
