import { api } from "./httpClient.js";
import { TEST_RESET_SECRET } from "./config.js";

export async function resetState() {
  const response = await api()
    .post("/__test__/reset")
    .set("x-test-reset-secret", TEST_RESET_SECRET);

  if (response.status !== 204) {
    throw new Error(
      `Test reset failed with status ${response.status}: ${JSON.stringify(response.body)}`
    );
  }
}
