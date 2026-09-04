import { Router } from "express";
import { changePin, login, me, registerStudent } from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", registerStudent);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/pin", requireAuth, requireRole("student"), changePin);
