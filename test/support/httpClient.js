import request from "supertest";
import { API_BASE_URL } from "./config.js";

export function api() {
  return request(API_BASE_URL);
}
