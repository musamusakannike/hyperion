import { Router } from "express";
import {
  changePin,
  login,
  me,
  registerPushToken,
  registerStudent,
  removePushToken,
  testPushNotification,
} from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", registerStudent);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/pin", requireAuth, requireRole("student"), changePin);

authRouter.post("/push-token", requireAuth, registerPushToken);
authRouter.post("/push-token/remove", requireAuth, removePushToken);
authRouter.post("/push-token/test", requireAuth, testPushNotification);
