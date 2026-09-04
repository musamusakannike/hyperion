import mongoose from "mongoose";
import { env } from "./env.config";

export const connectDB = async (): Promise<void> => {
    if(!env.mongoUri){
        throw new Error('MONGO_URI IS NOT DEFINED, set it in .env file');
    }
    try {
        await mongoose.connect(env.mongoUri);
        console.info('database connected successfully');
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}