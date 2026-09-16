import { Router } from "express";
import { createScan, listDriverTrips } from "../controllers/scan.controller";
import { requireDriver, requireScanCaller } from "../middlewares/auth.middleware";

export const scanRouter = Router();

scanRouter.post("/", requireScanCaller, createScan);
scanRouter.get("/trips", requireDriver, listDriverTrips);
