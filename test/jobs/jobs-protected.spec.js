import { expect } from "chai";
import {
  bearerToken,
  createCandidateSession,
  createRecruiterSession
} from "../support/auth.js";
import { buildJobPayload } from "../support/builders.js";
import {
  expectCreatedJob,
  expectErrorResponse,
  expectUnauthorizedMatrix
} from "../support/assertions.js";
import { api } from "../support/httpClient.js";
import { createJob } from "../support/jobs.js";
import { resetState } from "../support/reset.js";

describe("Recruiter Job Management API", function () {
  beforeEach(resetState);

  it("creates jobs for recruiters and rejects validation failures or wrong roles", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const payload = buildJobPayload({
      title: "Platform QA Engineer",
      description: "Build and maintain API automation.",
      location: "Remote",
      salary: 9000,
      status: "open"
    });

    const successResponse = await api()
      .post("/jobs")
      .set("Authorization", bearerToken(recruiter.token))
      .send(payload);

    expect(successResponse.status).to.equal(201);
    expectCreatedJob(successResponse.body, {
      ...payload,
      createdBy: recruiter.user.id
    });

    const invalidPayloadResponse = await api()
      .post("/jobs")
      .set("Authorization", bearerToken(recruiter.token))
      .send({
        title: "",
        description: "desc",
        location: "Sao Paulo, BR",
        salary: -1,
        status: "draft"
      });

    expectErrorResponse(invalidPayloadResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["title", "salary", "status"]
    });

    const wrongRoleResponse = await api()
      .post("/jobs")
      .set("Authorization", bearerToken(candidate.token))
      .send(payload);

    expectErrorResponse(wrongRoleResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only recruiters can access this resource"
    });
  });

  it("enforces missing, malformed, and invalid token handling on recruiter-only job routes", async function () {
    const recruiter = await createRecruiterSession();
    const createdJob = await createJob(recruiter.token);
    const routes = [
      (authorization) => {
        const request = api().post("/jobs").send(buildJobPayload());
        return authorization
          ? request.set("Authorization", authorization)
          : request;
      },
      (authorization) => {
        const request = api()
          .put(`/jobs/${createdJob.job.id}`)
          .send(buildJobPayload());
        return authorization
          ? request.set("Authorization", authorization)
          : request;
      },
      (authorization) => {
        const request = api().delete(`/jobs/${createdJob.job.id}`);
        return authorization
          ? request.set("Authorization", authorization)
          : request;
      }
    ];

    for (const makeRequest of routes) {
      await expectUnauthorizedMatrix(makeRequest);
    }
  });

  it("updates a recruiter's own job and blocks candidate or non-owner updates", async function () {
    const owner = await createRecruiterSession();
    const otherRecruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const createdJob = await createJob(owner.token);
    const updatePayload = buildJobPayload({
      title: "Updated QA Lead",
      description: "Updated automation scope.",
      location: "Hybrid",
      salary: 9900,
      status: "closed"
    });

    const updateResponse = await api()
      .put(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(owner.token))
      .send(updatePayload);
    const detailResponse = await api().get(`/jobs/${createdJob.job.id}`);

    expect(updateResponse.status).to.equal(204);
    expect(detailResponse.status).to.equal(200);
    expect(detailResponse.body).to.include({
      title: updatePayload.title,
      description: updatePayload.description,
      location: updatePayload.location,
      salary: updatePayload.salary,
      status: updatePayload.status
    });

    const candidateResponse = await api()
      .put(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(candidate.token))
      .send(updatePayload);
    const nonOwnerResponse = await api()
      .put(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(otherRecruiter.token))
      .send(updatePayload);
    const notFoundResponse = await api()
      .put("/jobs/99999")
      .set("Authorization", bearerToken(owner.token))
      .send(updatePayload);

    expectErrorResponse(candidateResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only recruiters can access this resource"
    });
    expectErrorResponse(nonOwnerResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "You can only update jobs created by you"
    });
    expectErrorResponse(notFoundResponse, {
      status: 404,
      code: "NOT_FOUND",
      message: "Job not found"
    });
  });

  it("deletes a recruiter's own job and removes it from public visibility", async function () {
    const owner = await createRecruiterSession();
    const otherRecruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const createdJob = await createJob(owner.token, {
      title: "Delete Me"
    });

    const candidateResponse = await api()
      .delete(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(candidate.token));
    const nonOwnerResponse = await api()
      .delete(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(otherRecruiter.token));

    expectErrorResponse(candidateResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only recruiters can access this resource"
    });
    expectErrorResponse(nonOwnerResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "You can only delete jobs created by you"
    });

    const deleteResponse = await api()
      .delete(`/jobs/${createdJob.job.id}`)
      .set("Authorization", bearerToken(owner.token));

    expect(deleteResponse.status).to.equal(204);

    const detailAfterDeleteResponse = await api().get(`/jobs/${createdJob.job.id}`);
    const listAfterDeleteResponse = await api().get("/jobs");
    const deleteMissingResponse = await api()
      .delete("/jobs/99999")
      .set("Authorization", bearerToken(owner.token));

    expectErrorResponse(detailAfterDeleteResponse, {
      status: 404,
      code: "NOT_FOUND",
      message: "Job not found"
    });
    expect(listAfterDeleteResponse.body.data.map((job) => job.id)).to.not.include(
      createdJob.job.id
    );
    expectErrorResponse(deleteMissingResponse, {
      status: 404,
      code: "NOT_FOUND",
      message: "Job not found"
    });
  });
});
