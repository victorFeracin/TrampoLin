import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  validateLoginBody,
  validateRegisterBody
} from "../utils/validators.js";

const router = Router();

router.post("/register", validateRegisterBody, asyncHandler(authController.register));
router.post("/login", validateLoginBody, asyncHandler(authController.login));
router.get("/me", authenticate, authController.me);

export default router;
