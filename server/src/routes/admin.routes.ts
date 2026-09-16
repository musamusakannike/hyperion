import { Router } from "express";
import {
  adjustPoints,
  bindRfid,
  createDriver,
  createDriverDevice,
  createStudent,
  listDevices,
  listTrips,
  listUsers,
  lookupStudentByRfid,
  rotateQr,
  stats,
  unbindRfid,
  updateUser,
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/stats", stats);
adminRouter.get("/users", listUsers);
adminRouter.post("/students", createStudent);
adminRouter.post("/drivers", createDriver);
adminRouter.patch("/users/:id", updateUser);
adminRouter.get("/rfid", lookupStudentByRfid);
adminRouter.post("/students/:id/rfid", bindRfid);
adminRouter.delete("/students/:id/rfid", unbindRfid);
adminRouter.post("/drivers/:id/qr/rotate", rotateQr);
adminRouter.post("/students/:id/points", adjustPoints);
adminRouter.get("/trips", listTrips);
adminRouter.get("/devices", listDevices);
adminRouter.post("/devices", createDriverDevice);
