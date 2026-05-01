import { ApiError } from "../utils/apiError.js";

export function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Validation failed",
        details: [{ field: "body", message: "Invalid JSON payload" }]
      }
    });
  }

  if (error instanceof ApiError) {
    const payload = {
      error: {
        code: error.code,
        message: error.message
      }
    };

    if (error.details) {
      payload.error.details = error.details;
    }

    return res.status(error.statusCode).json(payload);
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error"
    }
  });
}
