import { jobService } from "../services/jobService.js";

function createJob(req, res) {
  const job = jobService.createJob(req.body, req.user);
  return res.status(201).json(job);
}

function listJobs(req, res) {
  const result = jobService.listJobs(req.query);
  return res.status(200).json(result);
}

function getJobById(req, res) {
  const job = jobService.getJobById(req.params.id);
  return res.status(200).json(job);
}

function updateJob(req, res) {
  jobService.updateJob(req.params.id, req.body, req.user);
  return res.status(204).send();
}

function deleteJob(req, res) {
  jobService.deleteJob(req.params.id, req.user);
  return res.status(204).send();
}

export const jobController = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob
};
