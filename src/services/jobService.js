import { jobRepository } from "../repositories/jobRepository.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import { ApiError } from "../utils/apiError.js";
import { paginate } from "../utils/pagination.js";
import { userRepository } from "../repositories/userRepository.js";

function toPublicJob(job) {
  const recruiter = userRepository.findById(job.createdBy);

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    salary: job.salary,
    status: job.status,
    recruiter: {
      createdBy: recruiter.id,
      name: recruiter.name
    },
    createdAt: job.createdAt
  };
}

function toCreatedJob(job) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    salary: job.salary,
    status: job.status,
    createdBy: job.createdBy,
    createdAt: job.createdAt
  };
}

function createJob(data, user) {
  const job = jobRepository.create({
    title: data.title.trim(),
    description: data.description.trim(),
    location: data.location.trim(),
    salary: data.salary ?? null,
    status: data.status,
    createdBy: user.id,
    createdAt: new Date().toISOString()
  });

  return toCreatedJob(job);
}

function listJobs(query) {
  const jobs = jobRepository
    .findAll({
      title: query.title,
      location: query.location,
      status: query.status
    })
    .sort((a, b) => a.id - b.id)
    .map(toPublicJob);

  return paginate(jobs, query.page, query.limit);
}

function getJobById(id) {
  const job = jobRepository.findById(id);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found");
  }

  return toPublicJob(job);
}

function updateJob(id, data, user) {
  const job = jobRepository.findById(id);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found");
  }

  if (job.createdBy !== user.id) {
    throw new ApiError(403, "FORBIDDEN", "You can only update jobs created by you");
  }

  jobRepository.update(id, {
    title: data.title.trim(),
    description: data.description.trim(),
    location: data.location.trim(),
    salary: data.salary ?? null,
    status: data.status
  });
}

function deleteJob(id, user) {
  const job = jobRepository.findById(id);
  if (!job) {
    throw new ApiError(404, "NOT_FOUND", "Job not found");
  }

  if (job.createdBy !== user.id) {
    throw new ApiError(403, "FORBIDDEN", "You can only delete jobs created by you");
  }

  applicationRepository.removeByJobId(id);
  jobRepository.remove(id);
}

export const jobService = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
  toPublicJob
};
