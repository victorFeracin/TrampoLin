import { db, getNextId } from "../database/memory.js";

function create(userData) {
  const user = {
    id: getNextId("users"),
    ...userData
  };

  db.users.push(user);
  return user;
}

function findByEmail(email) {
  return db.users.find((user) => user.email === email) || null;
}

function findById(id) {
  return db.users.find((user) => user.id === id) || null;
}

export const userRepository = {
  create,
  findByEmail,
  findById
};
