import { Hono } from "hono";
import * as authController from "../controllers/authController.ts";
import * as twoFactorController from "../controllers/twoFactorController.ts";
import { authMiddleware } from "../middleware/auth.ts";

const auth = new Hono();

// Rutas públicas
auth.post("/register", authController.register);
auth.post("/login", authController.login);

// Rutas protegidas
auth.get("/me", authMiddleware, authController.me);

// Rutas de 2FA (protegidas)
auth.post("/2fa/setup", authMiddleware, twoFactorController.setup2FA);
auth.post("/2fa/enable", authMiddleware, twoFactorController.enable2FA);
auth.post("/2fa/disable", authMiddleware, twoFactorController.disable2FA);
auth.post("/2fa/verify", authMiddleware, twoFactorController.verify2FA);
auth.post("/2fa/backup-codes", authMiddleware, twoFactorController.regenerateBackupCodes);
auth.get("/2fa/status", authMiddleware, twoFactorController.get2FAStatus);

export default auth;
