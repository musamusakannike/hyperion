import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoSanitize from "mongo-sanitize";
import morgan from "morgan";

import { env, isProduction } from "./config/env.config";
import { notFoundMiddleware, errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: env.clientOrigins.length ? env.clientOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((request, _response, next) => {
  if (request.body) mongoSanitize(request.body);
  if (request.params) mongoSanitize(request.params);
  if (request.query) mongoSanitize(request.query);
  next();
});

app.get('/', (_request, response) => {
  response.status(200).json({ name: 'Africlana API', environment: env.nodeEnv });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

if (!isProduction) {
  app.set('json spaces', 2);
}
