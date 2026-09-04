import { Router } from "express";
import { getMyTrips, getQr, getWallet } from "../controllers/me.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const meRouter = Router();

meRouter.use(requireAuth, requireRole("student"));
meRouter.get("/wallet", getWallet);
meRouter.get("/qr", getQr);
meRouter.get("/trips", getMyTrips);
