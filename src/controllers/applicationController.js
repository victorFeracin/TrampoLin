import { applicationService } from "../services/applicationService.js";

function applyToJob(req, res) {
  const application = applicationService.applyToJob(
    req.params.id,
    req.body,
    req.user
  );

  return res.status(201).json(application);
}

function getMyApplications(req, res) {
  const result = applicationService.getMyApplications(
    req.user,
    req.query.page,
    req.query.limit
  );

  return res.status(200).json(result);
}

function getJobApplications(req, res) {
  const result = applicationService.getJobApplications(
    req.params.id,
    req.user,
    req.query.page,
    req.query.limit
  );

  return res.status(200).json(result);
}

export const applicationController = {
  applyToJob,
  getMyApplications,
  getJobApplications
};
