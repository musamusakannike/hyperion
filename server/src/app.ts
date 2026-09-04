import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoSanitize from "mongo-sanitize";
import morgan from "morgan";

import { env, isProduction } from "./config/env.config";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { meRouter } from "./routes/me.routes";
import { scanRouter } from "./routes/scan.routes";
import { webhookRouter } from "./routes/webhook.routes";

export const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
  }),
);

app.use(
  "/api/webhooks/paystack",
  express.json({
    limit: "1mb",
    verify: (request, _response, buffer) => {
      (request as express.Request & { rawBody?: string }).rawBody = buffer.toString("utf8");
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use((request, _response, next) => {
  if (request.body && typeof request.body === "object") mongoSanitize(request.body);
  next();
});

app.get("/", (_request, response) => {
  response.status(200).json({ name: "Hyperion API", environment: env.nodeEnv });
});

app.get("/health", (_request, response) => {
  response.status(200).json({ ok: true, name: "Hyperion API" });
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/scans", scanRouter);
app.use("/api/admin", adminRouter);
app.use("/api/webhooks", webhookRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

if (!isProduction) {
  app.set("json spaces", 2);
}
