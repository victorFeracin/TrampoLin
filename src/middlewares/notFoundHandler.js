import { ApiError } from "../utils/apiError.js";

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
}
