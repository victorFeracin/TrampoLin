import { expect } from "chai";
import { createRecruiterSession } from "../support/auth.js";
import {
  expectErrorResponse,
  expectPagination,
  expectPublicJob
} from "../support/assertions.js";
import { api } from "../support/httpClient.js";
import { createJob } from "../support/jobs.js";
import { resetState } from "../support/reset.js";

describe("Public Jobs API", function () {
  beforeEach(resetState);

  it("lists public jobs and returns a public job detail without authentication", async function () {
    const recruiter = await createRecruiterSession();
    const createdJob = await createJob(recruiter.token, {
      title: "Senior QA Engineer",
      description: "Lead API automation initiatives.",
      location: "Sao Paulo, BR",
      salary: 8500,
      status: "open"
    });

    const listResponse = await api().get("/jobs");
    const detailResponse = await api().get(`/jobs/${createdJob.job.id}`);

    expect(listResponse.status).to.equal(200);
    expect(listResponse.body.data).to.have.length(1);
    expectPagination(listResponse.body.pagination, {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    });
    expectPublicJob(listResponse.body.data[0], {
      ...createdJob.payload,
      createdBy: recruiter.user.id,
      recruiterName: recruiter.credentials.name
    });

    expect(detailResponse.status).to.equal(200);
    expectPublicJob(detailResponse.body, {
      ...createdJob.payload,
      createdBy: recruiter.user.id,
      recruiterName: recruiter.credentials.name
    });
  });

  it("supports public filtering by title, location, and status", async function () {
    const recruiter = await createRecruiterSession();

    await createJob(recruiter.token, {
      title: "QA Analyst",
      location: "Sao Paulo, BR",
      status: "open"
    });
    await createJob(recruiter.token, {
      title: "Backend Engineer",
      location: "Remote",
      status: "open"
    });
    await createJob(recruiter.token, {
      title: "QA Lead",
      location: "Remote",
      status: "closed"
    });

    const titleResponse = await api().get("/jobs").query({ title: "qa" });
    const combinedResponse = await api()
      .get("/jobs")
      .query({ location: "remote", status: "closed" });

    expect(titleResponse.status).to.equal(200);
    expect(titleResponse.body.data).to.have.length(2);
    expect(titleResponse.body.data.map((job) => job.title)).to.include.members([
      "QA Analyst",
      "QA Lead"
    ]);

    expect(combinedResponse.status).to.equal(200);
    expect(combinedResponse.body.data).to.have.length(1);
    expect(combinedResponse.body.data[0]).to.include({
      title: "QA Lead",
      location: "Remote",
      status: "closed"
    });
  });

  it("returns pagination metadata for default and explicit pagination", async function () {
    const recruiter = await createRecruiterSession();

    for (let index = 1; index <= 11; index += 1) {
      await createJob(recruiter.token, {
        title: `Job ${index}`,
        location: index <= 6 ? "Remote" : "Sao Paulo, BR"
      });
    }

    const defaultPageResponse = await api().get("/jobs");
    const customPageResponse = await api().get("/jobs").query({ page: 2, limit: 5 });

    expect(defaultPageResponse.status).to.equal(200);
    expect(defaultPageResponse.body.data).to.have.length(10);
    expectPagination(defaultPageResponse.body.pagination, {
      page: 1,
      limit: 10,
      total: 11,
      totalPages: 2
    });

    expect(customPageResponse.status).to.equal(200);
    expect(customPageResponse.body.data).to.have.length(5);
    expect(customPageResponse.body.data[0].title).to.equal("Job 6");
    expectPagination(customPageResponse.body.pagination, {
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3
    });
  });

  it("rejects invalid filter and pagination parameters", async function () {
    const invalidStatusResponse = await api().get("/jobs").query({ status: "draft" });
    const invalidPageResponse = await api().get("/jobs").query({ page: 0 });
    const invalidLimitResponse = await api().get("/jobs").query({ limit: 101 });

    expectErrorResponse(invalidStatusResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["status"]
    });
    expectErrorResponse(invalidPageResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["page"]
    });
    expectErrorResponse(invalidLimitResponse, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      detailFields: ["limit"]
    });
  });
});
