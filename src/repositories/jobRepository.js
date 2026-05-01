import { db, getNextId } from "../database/memory.js";

function create(jobData) {
  const job = {
    id: getNextId("jobs"),
    ...jobData
  };

  db.jobs.push(job);
  return job;
}

function findAll(filters = {}) {
  return db.jobs.filter((job) => {
    const matchesTitle =
      !filters.title ||
      job.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchesLocation =
      !filters.location ||
      job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesStatus = !filters.status || job.status === filters.status;

    return matchesTitle && matchesLocation && matchesStatus;
  });
}

function findById(id) {
  return db.jobs.find((job) => job.id === id) || null;
}

function update(id, updates) {
  const index = db.jobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return null;
  }

  db.jobs[index] = { ...db.jobs[index], ...updates };
  return db.jobs[index];
}

function remove(id) {
  const index = db.jobs.findIndex((job) => job.id === id);
  if (index === -1) {
    return false;
  }

  db.jobs.splice(index, 1);
  return true;
}

export const jobRepository = {
  create,
  findAll,
  findById,
  update,
  remove
};
