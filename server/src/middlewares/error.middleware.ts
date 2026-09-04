import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/app-error";

export const notFoundMiddleware: RequestHandler = (request, response) => {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError
    ? error.statusCode
    : typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    message: statusCode === 500 ? "Internal server error." : error.message,
    code: isAppError ? error.code : undefined,
  });
};
