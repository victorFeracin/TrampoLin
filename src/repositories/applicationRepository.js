import { db, getNextId } from "../database/memory.js";

function create(applicationData) {
  const application = {
    id: getNextId("applications"),
    ...applicationData
  };

  db.applications.push(application);
  return application;
}

function findByCandidateAndJob(candidateId, jobId) {
  return (
    db.applications.find(
      (application) =>
        application.candidateId === candidateId && application.jobId === jobId
    ) || null
  );
}

function findByCandidateId(candidateId) {
  return db.applications.filter(
    (application) => application.candidateId === candidateId
  );
}

function findByJobId(jobId) {
  return db.applications.filter((application) => application.jobId === jobId);
}

function removeByJobId(jobId) {
  db.applications = db.applications.filter(
    (application) => application.jobId !== jobId
  );
}

export const applicationRepository = {
  create,
  findByCandidateAndJob,
  findByCandidateId,
  findByJobId,
  removeByJobId
};
