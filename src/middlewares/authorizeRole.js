import { ApiError } from "../utils/apiError.js";

export function authorizeRole(role, message) {
  return (req, _res, next) => {
    if (req.user.role !== role) {
      return next(new ApiError(403, "FORBIDDEN", message));
    }

    next();
  };
}
