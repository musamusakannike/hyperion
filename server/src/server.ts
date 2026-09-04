import { app } from "./app";
import { connectDB } from "./config/db.config";
import { env } from "./config/env.config";

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(env.port, () => {
            console.info(`Hyperion server is running on http://localhost:${env.port} in ${env.nodeEnv} mode`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
};

startServer().catch((error: unknown) => {
    console.error("Failed to start the server:", error);
    process.exit(1);
});
