import { buildUserPayload } from "./builders.js";
import { api } from "./httpClient.js";

export function bearerToken(token) {
  return `Bearer ${token}`;
}

export async function registerUser(overrides = {}) {
  const payload = buildUserPayload(overrides);
  const response = await api().post("/auth/register").send(payload);

  return {
    payload,
    response,
    user: response.body
  };
}

export async function loginUser({ email, password }) {
  return api().post("/auth/login").send({ email, password });
}

export async function registerAndLogin(overrides = {}) {
  const registration = await registerUser(overrides);
  const loginResponse = await loginUser({
    email: registration.payload.email,
    password: registration.payload.password
  });

  return {
    credentials: registration.payload,
    user: registration.user,
    token: loginResponse.body.token,
    registerResponse: registration.response,
    loginResponse
  };
}

export async function createRecruiterSession(overrides = {}) {
  return registerAndLogin({
    role: "recruiter",
    ...overrides
  });
}

export async function createCandidateSession(overrides = {}) {
  return registerAndLogin({
    role: "candidate",
    ...overrides
  });
}
