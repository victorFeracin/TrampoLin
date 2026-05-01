import { Router } from "express";
import { jobController } from "../controllers/jobController.js";
import { applicationController } from "../controllers/applicationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/authorizeRole.js";
import { ROLES } from "../utils/constants.js";
import {
  validateApplyBody,
  validateCreateJobBody,
  validateJobIdParam,
  validateJobsQuery,
  validatePaginationQuery,
  validateUpdateJobBody
} from "../utils/validators.js";

const router = Router();

router.get("/", validateJobsQuery, jobController.listJobs);
router.post(
  "/",
  authenticate,
  authorizeRole(ROLES.RECRUITER, "Only recruiters can access this resource"),
  validateCreateJobBody,
  jobController.createJob
);
router.post(
  "/:id/apply",
  authenticate,
  authorizeRole(ROLES.CANDIDATE, "Only candidates can access this resource"),
  validateJobIdParam,
  validateApplyBody,
  applicationController.applyToJob
);
router.get(
  "/:id/applications",
  authenticate,
  authorizeRole(ROLES.RECRUITER, "Only recruiters can access this resource"),
  validateJobIdParam,
  validatePaginationQuery,
  applicationController.getJobApplications
);
router.get("/:id", validateJobIdParam, jobController.getJobById);
router.put(
  "/:id",
  authenticate,
  authorizeRole(ROLES.RECRUITER, "Only recruiters can access this resource"),
  validateJobIdParam,
  validateUpdateJobBody,
  jobController.updateJob
);
router.delete(
  "/:id",
  authenticate,
  authorizeRole(ROLES.RECRUITER, "Only recruiters can access this resource"),
  validateJobIdParam,
  jobController.deleteJob
);

export default router;
