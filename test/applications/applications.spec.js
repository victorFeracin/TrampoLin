import { expect } from "chai";
import {
  bearerToken,
  createCandidateSession,
  createRecruiterSession
} from "../support/auth.js";
import { buildApplicationPayload } from "../support/builders.js";
import {
  expectApplicant,
  expectApplication,
  expectErrorResponse,
  expectPagination,
  expectPublicJob,
  expectUnauthorizedMatrix
} from "../support/assertions.js";
import { api } from "../support/httpClient.js";
import { createJob } from "../support/jobs.js";
import { resetState } from "../support/reset.js";

describe("Applications API", function () {
  beforeEach(resetState);

  it("allows a candidate to apply to an open job and prevents duplicates", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const createdJob = await createJob(recruiter.token);
    const payload = buildApplicationPayload();

    const firstResponse = await api()
      .post(`/jobs/${createdJob.job.id}/apply`)
      .set("Authorization", bearerToken(candidate.token))
      .send(payload);

    expect(firstResponse.status).to.equal(201);
    expectApplication(firstResponse.body, {
      jobId: createdJob.job.id,
      candidateId: candidate.user.id,
      resumeUrl: payload.resumeUrl
    });

    const duplicateResponse = await api()
      .post(`/jobs/${createdJob.job.id}/apply`)
      .set("Authorization", bearerToken(candidate.token))
      .send(payload);

    expectErrorResponse(duplicateResponse, {
      status: 409,
      code: "CONFLICT",
      message: "You have already applied to this job"
    });
  });

  it("rejects invalid apply payloads, closed jobs, missing jobs, and recruiter role misuse", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const openJob = await createJob(recruiter.token);
    const closedJob = await createJob(recruiter.token, { status: "closed" });

    const unexpectedFieldResponse = await api()
      .post(`/jobs/${openJob.job.id}/apply`)
      .set("Authorization", bearerToken(candidate.token))
      .send({ resumeUrl: buildApplicationPayload().resumeUrl, candidateId: 999 });

    expectErrorResponse(unexpectedFieldResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["candidateId"]
    });

    const invalidResumeResponse = await api()
      .post(`/jobs/${openJob.job.id}/apply`)
      .set("Authorization", bearerToken(candidate.token))
      .send({ resumeUrl: "" });

    expectErrorResponse(invalidResumeResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["resumeUrl"]
    });

    const closedJobResponse = await api()
      .post(`/jobs/${closedJob.job.id}/apply`)
      .set("Authorization", bearerToken(candidate.token))
      .send(buildApplicationPayload());
    const missingJobResponse = await api()
      .post("/jobs/99999/apply")
      .set("Authorization", bearerToken(candidate.token))
      .send(buildApplicationPayload());
    const wrongRoleResponse = await api()
      .post(`/jobs/${openJob.job.id}/apply`)
      .set("Authorization", bearerToken(recruiter.token))
      .send(buildApplicationPayload());

    expectErrorResponse(closedJobResponse, {
      status: 409,
      code: "CONFLICT",
      message: "Cannot apply to a closed job"
    });
    expectErrorResponse(missingJobResponse, {
      status: 404,
      code: "NOT_FOUND",
      message: "Job not found"
    });
    expectErrorResponse(wrongRoleResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only candidates can access this resource"
    });
  });

  it("enforces missing, malformed, and invalid token handling on application routes", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const createdJob = await createJob(recruiter.token);

    await expectUnauthorizedMatrix((authorization) => {
      const request = api()
        .post(`/jobs/${createdJob.job.id}/apply`)
        .send(buildApplicationPayload());
      return authorization
        ? request.set("Authorization", authorization)
        : request;
    });

    await expectUnauthorizedMatrix((authorization) => {
      const request = api().get("/applications/me");
      return authorization
        ? request.set("Authorization", authorization)
        : request;
    });

    await expectUnauthorizedMatrix((authorization) => {
      const request = api().get(`/jobs/${createdJob.job.id}/applications`);
      return authorization
        ? request.set("Authorization", authorization)
        : request;
    });

    expect(candidate.user.role).to.equal("candidate");
  });

  it("returns candidate application history with pagination and role isolation", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();
    const otherCandidate = await createCandidateSession();

    for (let index = 1; index <= 11; index += 1) {
      const job = await createJob(recruiter.token, {
        title: `Application History Job ${index}`
      });

      await api()
        .post(`/jobs/${job.job.id}/apply`)
        .set("Authorization", bearerToken(candidate.token))
        .send(buildApplicationPayload());
    }

    const extraJob = await createJob(recruiter.token, {
      title: "Other Candidate Job"
    });
    await api()
      .post(`/jobs/${extraJob.job.id}/apply`)
      .set("Authorization", bearerToken(otherCandidate.token))
      .send(buildApplicationPayload());

    const historyResponse = await api()
      .get("/applications/me")
      .set("Authorization", bearerToken(candidate.token))
      .query({ page: 2, limit: 5 });

    expect(historyResponse.status).to.equal(200);
    expect(historyResponse.body.data).to.have.length(5);
    expectPagination(historyResponse.body.pagination, {
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3
    });
    expect(historyResponse.body.data[0].job.title).to.equal(
      "Application History Job 6"
    );

    for (const item of historyResponse.body.data) {
      expect(item.id).to.be.a("number");
      expect(item.job.recruiter.name).to.equal(recruiter.credentials.name);
      expectPublicJob(item.job, {
        title: item.job.title,
        description: item.job.description,
        location: item.job.location,
        salary: item.job.salary,
        status: item.job.status,
        createdBy: recruiter.user.id,
        recruiterName: recruiter.credentials.name
      });
    }
  });

  it("returns an empty candidate history and rejects invalid access patterns", async function () {
    const recruiter = await createRecruiterSession();
    const candidate = await createCandidateSession();

    const emptyHistoryResponse = await api()
      .get("/applications/me")
      .set("Authorization", bearerToken(candidate.token));

    expect(emptyHistoryResponse.status).to.equal(200);
    expect(emptyHistoryResponse.body.data).to.deep.equal([]);
    expectPagination(emptyHistoryResponse.body.pagination, {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

    const invalidPaginationResponse = await api()
      .get("/applications/me")
      .set("Authorization", bearerToken(candidate.token))
      .query({ limit: 0 });
    const wrongRoleResponse = await api()
      .get("/applications/me")
      .set("Authorization", bearerToken(recruiter.token));

    expectErrorResponse(invalidPaginationResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["limit"]
    });
    expectErrorResponse(wrongRoleResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only candidates can access this resource"
    });
  });

  it("returns recruiter applicant reviews with pagination and ownership checks", async function () {
    const recruiter = await createRecruiterSession();
    const otherRecruiter = await createRecruiterSession();
    const job = await createJob(recruiter.token, {
      title: "Applicants Job"
    });

    const expectedCandidates = [];

    for (let index = 1; index <= 11; index += 1) {
      const candidate = await createCandidateSession({
        name: `Candidate ${index}`
      });

      expectedCandidates.push(candidate);

      await api()
        .post(`/jobs/${job.job.id}/apply`)
        .set("Authorization", bearerToken(candidate.token))
        .send(
          buildApplicationPayload({
            resumeUrl: `https://example.com/resumes/candidate-${index}.pdf`
          })
        );
    }

    const listResponse = await api()
      .get(`/jobs/${job.job.id}/applications`)
      .set("Authorization", bearerToken(recruiter.token))
      .query({ page: 2, limit: 5 });

    expect(listResponse.status).to.equal(200);
    expect(listResponse.body.data).to.have.length(5);
    expectPagination(listResponse.body.pagination, {
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3
    });

    const firstApplicant = listResponse.body.data[0];
    expectApplicant(firstApplicant.candidate, {
      id: expectedCandidates[5].user.id,
      name: expectedCandidates[5].credentials.name,
      email: expectedCandidates[5].credentials.email
    });
    expect(firstApplicant.resumeUrl).to.equal(
      "https://example.com/resumes/candidate-6.pdf"
    );

    const emptyJob = await createJob(recruiter.token, {
      title: "No Applicants Yet"
    });
    const emptyResponse = await api()
      .get(`/jobs/${emptyJob.job.id}/applications`)
      .set("Authorization", bearerToken(recruiter.token));

    expect(emptyResponse.status).to.equal(200);
    expect(emptyResponse.body.data).to.deep.equal([]);
    expectPagination(emptyResponse.body.pagination, {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });

    const candidate = await createCandidateSession();
    const candidateForbiddenResponse = await api()
      .get(`/jobs/${job.job.id}/applications`)
      .set("Authorization", bearerToken(candidate.token));
    const nonOwnerResponse = await api()
      .get(`/jobs/${job.job.id}/applications`)
      .set("Authorization", bearerToken(otherRecruiter.token));
    const invalidPaginationResponse = await api()
      .get(`/jobs/${job.job.id}/applications`)
      .set("Authorization", bearerToken(recruiter.token))
      .query({ page: 0 });
    const missingJobResponse = await api()
      .get("/jobs/99999/applications")
      .set("Authorization", bearerToken(recruiter.token));

    expectErrorResponse(candidateForbiddenResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "Only recruiters can access this resource"
    });
    expectErrorResponse(nonOwnerResponse, {
      status: 403,
      code: "FORBIDDEN",
      message: "You can only view applications for jobs created by you"
    });
    expectErrorResponse(invalidPaginationResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["page"]
    });
    expectErrorResponse(missingJobResponse, {
      status: 404,
      code: "NOT_FOUND",
      message: "Job not found"
    });
  });
});
