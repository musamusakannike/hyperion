import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const SALT_ROUNDS = 10;

export const hashSecret = async (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const verifySecret = async (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("hex");

export const normalizeScanToken = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase().startsWith("HYP:")) {
    return trimmed.slice(4);
  }
  return trimmed;
};

/** Hex UID from RC522 / Wokwi: strip separators, uppercase. */
export const normalizeRfidUid = (raw: string): string =>
  raw.replace(/[^0-9a-fA-F]/g, "").toUpperCase();

export const assertPinFormat = (pin: string): void => {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error("PIN must be 4 to 6 digits");
  }
};
