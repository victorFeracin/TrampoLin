import { Router } from "express";
import { resetDb } from "../database/memory.js";
import { ApiError } from "../utils/apiError.js";

const router = Router();

router.post("/reset", (_req, res, next) => {
  const expectedSecret =
    process.env.TEST_RESET_SECRET || "local-test-reset-secret";
  const providedSecret = _req.get("x-test-reset-secret");

  if (providedSecret !== expectedSecret) {
    return next(
      new ApiError(401, "UNAUTHORIZED", "Missing or invalid test reset token")
    );
  }

  resetDb();
  return res.status(204).send();
});

export default router;
