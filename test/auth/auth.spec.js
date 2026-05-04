import { expect } from "chai";
import { createCandidateSession, bearerToken } from "../support/auth.js";
import { buildUserPayload } from "../support/builders.js";
import {
  expectErrorResponse,
  expectPublicUser,
  expectUnauthorizedMatrix
} from "../support/assertions.js";
import { api } from "../support/httpClient.js";
import { resetState } from "../support/reset.js";

describe("Authentication API", function () {
  beforeEach(resetState);

  describe("POST /auth/register", function () {
    it("registers candidate and recruiter users without exposing sensitive fields", async function () {
      const candidatePayload = buildUserPayload({ role: "candidate" });
      const recruiterPayload = buildUserPayload({ role: "recruiter" });

      const candidateResponse = await api()
        .post("/auth/register")
        .send(candidatePayload);
      const recruiterResponse = await api()
        .post("/auth/register")
        .send(recruiterPayload);

      expect(candidateResponse.status).to.equal(201);
      expectPublicUser(candidateResponse.body, candidatePayload);

      expect(recruiterResponse.status).to.equal(201);
      expectPublicUser(recruiterResponse.body, recruiterPayload);
    });

    it("rejects invalid registration payloads", async function () {
      const invalidCases = [
        {
          payload: {},
          detailFields: ["name", "email", "password", "role"]
        },
        {
          payload: {
            name: "Ana",
            email: "invalid-email",
            password: "StrongPass123",
            role: "manager"
          },
          detailFields: ["email", "role"]
        },
        {
          payload: {
            ...buildUserPayload(),
            extraField: "not-allowed"
          },
          detailFields: ["extraField"]
        }
      ];

      for (const testCase of invalidCases) {
        const response = await api().post("/auth/register").send(testCase.payload);

        expectErrorResponse(response, {
          status: 400,
          code: "BAD_REQUEST",
          message: "Validation failed",
          detailFields: testCase.detailFields
        });
      }
    });

    it("rejects duplicate email registration attempts", async function () {
      const payload = buildUserPayload();

      const firstResponse = await api().post("/auth/register").send(payload);
      const duplicateResponse = await api().post("/auth/register").send(payload);

      expect(firstResponse.status).to.equal(201);
      expectErrorResponse(duplicateResponse, {
        status: 409,
        code: "CONFLICT",
        message: "Email already registered"
      });
    });
  });

  describe("POST /auth/login and GET /auth/me", function () {
    it("logs in and reuses the token to fetch the authenticated profile", async function () {
      const session = await createCandidateSession();

      expect(session.loginResponse.status).to.equal(200);
      expect(session.loginResponse.body.token).to.be.a("string").and.not.empty;

      const meResponse = await api()
        .get("/auth/me")
        .set("Authorization", bearerToken(session.token));

      expect(meResponse.status).to.equal(200);
      expectPublicUser(meResponse.body, session.credentials);
      expect(meResponse.body.id).to.equal(session.user.id);
    });

    it("rejects invalid login payloads and credentials", async function () {
      const session = await createCandidateSession();

      const invalidPayloadResponse = await api()
        .post("/auth/login")
        .send({ email: "bad-email" });

      expectErrorResponse(invalidPayloadResponse, {
        status: 400,
        code: "BAD_REQUEST",
        message: "Validation failed",
        detailFields: ["email", "password"]
      });

      const invalidCredentialsResponse = await api().post("/auth/login").send({
        email: session.credentials.email,
        password: "WrongPass123"
      });

      expectErrorResponse(invalidCredentialsResponse, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid credentials"
      });
    });

    it("rejects missing, malformed, and invalid tokens on /auth/me", async function () {
      await createCandidateSession();

      await expectUnauthorizedMatrix((authorization) => {
        const request = api().get("/auth/me");
        return authorization
          ? request.set("Authorization", authorization)
          : request;
      });
    });
  });
});
