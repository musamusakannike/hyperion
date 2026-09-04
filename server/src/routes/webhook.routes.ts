import { Router } from "express";
import { paystackWebhook } from "../controllers/webhook.controller";

export const webhookRouter = Router();

webhookRouter.post("/paystack", paystackWebhook);
