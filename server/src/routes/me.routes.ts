import { Router } from "express";
import { getMyTrips, getQr, getWallet, initializeFunding } from "../controllers/me.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const meRouter = Router();

meRouter.get("/wallet", requireAuth, requireRole("student"), getWallet);
meRouter.post("/funding/initialize", requireAuth, requireRole("student"), initializeFunding);
meRouter.get("/trips", requireAuth, requireRole("student"), getMyTrips);
meRouter.get("/qr", requireAuth, requireRole("driver"), getQr);
