export const db = {
  users: [],
  jobs: [],
  applications: [],
  counters: {
    users: 1,
    jobs: 1,
    applications: 1
  }
};

export function getNextId(entityName) {
  const nextId = db.counters[entityName];
  db.counters[entityName] += 1;
  return nextId;
}
