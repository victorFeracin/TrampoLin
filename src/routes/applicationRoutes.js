import { Router } from "express";
import { applicationController } from "../controllers/applicationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";
import { ROLES } from "../utils/constants.js";
import { validatePaginationQuery } from "../utils/validators.js";

const router = Router();

router.get(
  "/me",
  authenticate,
  authorizeRole(ROLES.CANDIDATE, "Only candidates can access this resource"),
  validatePaginationQuery,
  applicationController.getMyApplications
);

export default router;
