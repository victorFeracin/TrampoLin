import { expect } from "chai";

export function expectIsoDate(value) {
  expect(value).to.be.a("string");
  expect(Number.isNaN(Date.parse(value))).to.equal(false);
}

export function expectNoSensitiveFields(target, fields = ["password", "passwordHash"]) {
  for (const field of fields) {
    expect(target).to.not.have.property(field);
  }
}

export function expectErrorResponse(
  response,
  { status, code, message, detailFields = null }
) {
  expect(response.status).to.equal(status);
  expect(response.body).to.have.property("error");
  expect(response.body.error).to.include({
    code,
    message
  });

  if (detailFields) {
    expect(response.body.error.details).to.be.an("array");
    const fields = response.body.error.details.map((detail) => detail.field);

    expect(fields).to.include.members(detailFields);
  }
}

export async function expectUnauthorizedMatrix(makeRequest) {
  const missingTokenResponse = await makeRequest();
  expectErrorResponse(missingTokenResponse, {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Missing or invalid token"
  });

  const malformedTokenResponse = await makeRequest("Token malformed");
  expectErrorResponse(malformedTokenResponse, {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Missing or invalid token"
  });

  const invalidTokenResponse = await makeRequest("Bearer invalid.token.value");
  expectErrorResponse(invalidTokenResponse, {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Missing or invalid token"
  });
}

export function expectPublicUser(user, expected = {}) {
  expect(user).to.include({
    name: expected.name,
    email: expected.email,
    role: expected.role
  });
  expect(user.id).to.be.a("number");
  expectIsoDate(user.createdAt);
  expectNoSensitiveFields(user);
}

export function expectCreatedJob(job, expected = {}) {
  expect(job).to.include({
    title: expected.title,
    description: expected.description,
    location: expected.location,
    status: expected.status
  });

  if (expected.salary === null) {
    expect(job.salary).to.equal(null);
  } else if (expected.salary !== undefined) {
    expect(job.salary).to.equal(expected.salary);
  }

  expect(job.id).to.be.a("number");
  expect(job.createdBy).to.equal(expected.createdBy);
  expectIsoDate(job.createdAt);
}

export function expectPublicJob(job, expected = {}) {
  expect(job).to.include({
    title: expected.title,
    description: expected.description,
    location: expected.location,
    status: expected.status
  });

  if (expected.salary === null) {
    expect(job.salary).to.equal(null);
  } else if (expected.salary !== undefined) {
    expect(job.salary).to.equal(expected.salary);
  }

  expect(job.id).to.be.a("number");
  expect(job.recruiter).to.deep.equal({
    createdBy: expected.createdBy,
    name: expected.recruiterName
  });
  expectIsoDate(job.createdAt);
  expectNoSensitiveFields(job.recruiter, ["email", "password", "passwordHash"]);
}

export function expectPagination(pagination, expected) {
  expect(pagination).to.deep.include(expected);
}

export function expectApplication(application, expected = {}) {
  expect(application).to.include({
    jobId: expected.jobId,
    candidateId: expected.candidateId,
    resumeUrl: expected.resumeUrl
  });
  expect(application.id).to.be.a("number");
  expectIsoDate(application.appliedAt);
}

export function expectApplicant(candidate, expected = {}) {
  expect(candidate).to.include({
    id: expected.id,
    name: expected.name,
    email: expected.email
  });
  expectNoSensitiveFields(candidate);
}
