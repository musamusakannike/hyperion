import { Router } from "express";
import { getMyTrips, getQr, getWallet, initializeFunding } from "../controllers/me.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const meRouter = Router();

meRouter.use(requireAuth, requireRole("student"));
meRouter.get("/wallet", getWallet);
meRouter.post("/funding/initialize", initializeFunding);
meRouter.get("/qr", getQr);
meRouter.get("/trips", getMyTrips);
