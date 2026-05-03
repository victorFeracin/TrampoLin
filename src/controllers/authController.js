import { authService } from "../services/authService.js";

async function register(req, res) {
  const user = await authService.register(req.body);
  return res.status(201).json(user);
}

async function login(req, res) {
  const result = await authService.login(req.body);
  return res.status(200).json(result);
}

function me(req, res) {
  const user = authService.getProfile(req.user);
  return res.status(200).json(user);
}

export const authController = {
  register,
  login,
  me
};
