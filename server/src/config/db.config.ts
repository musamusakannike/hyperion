import mongoose from "mongoose";
import { env } from "./env.config";

export const connectDB = async (): Promise<void> => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not defined. Set it in the .env file.");
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.info("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};
