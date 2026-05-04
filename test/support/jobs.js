import { buildJobPayload } from "./builders.js";
import { bearerToken } from "./auth.js";
import { api } from "./httpClient.js";

export async function createJob(token, overrides = {}) {
  const payload = buildJobPayload(overrides);
  const response = await api()
    .post("/jobs")
    .set("Authorization", bearerToken(token))
    .send(payload);

  return {
    payload,
    response,
    job: response.body
  };
}
