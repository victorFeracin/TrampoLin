import { applicationRepository } from "../repositories/applicationRepository.js";
import { jobRepository } from "../repositories/jobRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import { JOB_STATUS } from "../utils/constants.js";
import { paginate } from "../utils/pagination.js";
import { jobService } from "./jobService.js";

function applyToJob(jobId, data, user) {
  const job = jobRepository.findById(jobId);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found");
  }

  if (job.status === JOB_STATUS.CLOSED) {
    throw new ApiError(409, "CONFLICT", "Cannot apply to a closed job");
  }

  const existingApplication = applicationRepository.findByCandidateAndJob(
    user.id,
    jobId
  );

  if (existingApplication) {
    throw new ApiError(409, "CONFLICT", "You have already applied to this job");
  }

  return applicationRepository.create({
    jobId,
    candidateId: user.id,
    resumeUrl: data.resumeUrl,
    appliedAt: new Date().toISOString()
  });
}

function getMyApplications(user, page, limit) {
  const applications = applicationRepository
    .findByCandidateId(user.id)
    .sort((a, b) => a.id - b.id)
    .map((application) => {
      const job = jobRepository.findById(application.jobId);

      return {
        id: application.id,
        appliedAt: application.appliedAt,
        job: jobService.toPublicJob(job)
      };
    });

  return paginate(applications, page, limit);
}

function getJobApplications(jobId, user, page, limit) {
  const job = jobRepository.findById(jobId);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found");
  }

  if (job.createdBy !== user.id) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You can only view applications for jobs created by you"
    );
  }

  const applications = applicationRepository
    .findByJobId(jobId)
    .sort((a, b) => a.id - b.id)
    .map((application) => {
      const candidate = userRepository.findById(application.candidateId);

      return {
        id: application.id,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email
        },
        resumeUrl: application.resumeUrl,
        appliedAt: application.appliedAt
      };
    });

  return paginate(applications, page, limit);
}

export const applicationService = {
  applyToJob,
  getMyApplications,
  getJobApplications
};
