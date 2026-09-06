import "dotenv/config";

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI,
  clientOrigins: (process.env.CLIENT_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: required("JWT_SECRET", "development-only-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  ridePriceKobo: Number(process.env.RIDE_PRICE_KOBO ?? 25_000),
  scanPinRequired: (process.env.SCAN_PIN_REQUIRED ?? "true") !== "false",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@hyperion.local",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeAdmin1!",
  seedAdminName: process.env.SEED_ADMIN_NAME ?? "Hyperion Admin",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL ?? "",
};

export const isProduction = env.nodeEnv === "production";
