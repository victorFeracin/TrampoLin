import { ApiError } from "../utils/apiError.js";
import { verifyToken } from "../utils/jwt.js";
import { userRepository } from "../repositories/userRepository.js";

export function authenticate(req, _res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = verifyToken(token);
    const user = userRepository.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid token");
    }

    req.user = user;
    next();
  } catch (_error) {
    next(new ApiError(401, "UNAUTHORIZED", "Missing or invalid token"));
  }
}
