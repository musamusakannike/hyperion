import { Router } from "express";
import { createScan, listDriverTrips } from "../controllers/scan.controller";
import { requireDriver } from "../middlewares/auth.middleware";

export const scanRouter = Router();

scanRouter.post("/", requireDriver, createScan);
scanRouter.get("/trips", requireDriver, listDriverTrips);
