import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import { signToken } from "../utils/jwt.js";

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

async function register(data) {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existingUser = userRepository.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new ApiError(409, "CONFLICT", "Email already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = userRepository.create({
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: data.role,
    createdAt: new Date().toISOString()
  });

  return toPublicUser(user);
}

async function login(data) {
  const user = userRepository.findByEmail(data.email.trim().toLowerCase());
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  return {
    token: signToken({
      sub: user.id,
      role: user.role
    })
  };
}

function getProfile(user) {
  return toPublicUser(user);
}

export const authService = {
  register,
  login,
  getProfile
};
