import { Router } from "express";
import { createScan, getDriverFeed, listDriverTrips } from "../controllers/scan.controller";
import { requireDriver, requireScanCaller } from "../middlewares/auth.middleware";

export const scanRouter = Router();

scanRouter.post("/", requireScanCaller, createScan);
scanRouter.get("/feed", requireDriver, getDriverFeed);
scanRouter.get("/trips", requireDriver, listDriverTrips);
