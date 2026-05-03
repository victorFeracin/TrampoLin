import { ApiError } from "./apiError.js";
import { JOB_STATUS, ROLES } from "./constants.js";

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createValidationError(details) {
  return new ApiError(400, "BAD_REQUEST", "Validation failed", details);
}

function ensureObject(body) {
  if (!isPlainObject(body)) {
    throw createValidationError([
      { field: "body", message: "Request body must be a JSON object" }
    ]);
  }
}

function ensureAllowedFields(body, allowedFields) {
  const details = Object.keys(body)
    .filter((field) => !allowedFields.includes(field))
    .map((field) => ({
      field,
      message: "Field is not allowed"
    }));

  if (details.length > 0) {
    throw createValidationError(details);
  }
}

function requireNonEmptyString(value, field, details) {
  if (typeof value !== "string" || value.trim().length === 0) {
    details.push({ field, message: `${field} is required` });
  }
}

function requireEmail(value, field, details) {
  if (typeof value !== "string" || value.trim().length === 0) {
    details.push({ field, message: `${field} is required` });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    details.push({ field, message: "Email must be a valid email address" });
  }
}

function requireEnum(value, field, validValues, details) {
  if (typeof value !== "string" || !validValues.includes(value)) {
    details.push({
      field,
      message: `${field} must be one of: ${validValues.join(", ")}`
    });
  }
}

function optionalNonNegativeNumber(value, field, details) {
  if (value === undefined) {
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    details.push({
      field,
      message: `${field} must be a number greater than or equal to 0`
    });
  }
}

function requireUri(value, field, details) {
  if (typeof value !== "string" || value.trim().length === 0) {
    details.push({ field, message: `${field} is required` });
    return;
  }

  try {
    new URL(value);
  } catch {
    details.push({ field, message: `${field} must be a valid URI` });
  }
}

function parsePositiveInteger(value, fieldName, defaultValue, maxValue) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createValidationError([
      {
        field: fieldName,
        message: `${fieldName} must be an integer greater than or equal to 1`
      }
    ]);
  }

  if (maxValue !== undefined && parsed > maxValue) {
    throw createValidationError([
      {
        field: fieldName,
        message: `${fieldName} must be less than or equal to ${maxValue}`
      }
    ]);
  }

  return parsed;
}

function parseJobId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createValidationError([
      { field: "id", message: "id must be a positive integer" }
    ]);
  }

  return parsed;
}

export function validateRegisterBody(req, _res, next) {
  try {
    ensureObject(req.body);
    ensureAllowedFields(req.body, ["name", "email", "password", "role"]);

    const details = [];
    requireNonEmptyString(req.body.name, "name", details);
    requireEmail(req.body.email, "email", details);
    requireNonEmptyString(req.body.password, "password", details);
    requireEnum(req.body.role, "role", Object.values(ROLES), details);

    if (details.length > 0) {
      throw createValidationError(details);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function validateLoginBody(req, _res, next) {
  try {
    ensureObject(req.body);
    ensureAllowedFields(req.body, ["email", "password"]);

    const details = [];
    requireEmail(req.body.email, "email", details);
    requireNonEmptyString(req.body.password, "password", details);

    if (details.length > 0) {
      throw createValidationError(details);
    }

    next();
  } catch (error) {
    next(error);
  }
}

function validateJobBody(req, _res, next) {
  try {
    ensureObject(req.body);
    ensureAllowedFields(req.body, [
      "title",
      "description",
      "location",
      "salary",
      "status"
    ]);

    const details = [];
    requireNonEmptyString(req.body.title, "title", details);
    requireNonEmptyString(req.body.description, "description", details);
    requireNonEmptyString(req.body.location, "location", details);
    optionalNonNegativeNumber(req.body.salary, "salary", details);
    requireEnum(req.body.status, "status", Object.values(JOB_STATUS), details);

    if (details.length > 0) {
      throw createValidationError(details);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export const validateCreateJobBody = validateJobBody;
export const validateUpdateJobBody = validateJobBody;

export function validateApplyBody(req, _res, next) {
  try {
    ensureObject(req.body);
    ensureAllowedFields(req.body, ["resumeUrl"]);

    const details = [];
    requireUri(req.body.resumeUrl, "resumeUrl", details);

    if (details.length > 0) {
      throw createValidationError(details);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function validateJobIdParam(req, _res, next) {
  try {
    req.params.id = parseJobId(req.params.id);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateJobsQuery(req, _res, next) {
  try {
    const { title, location, status, page, limit } = req.query;

    if (title !== undefined && typeof title !== "string") {
      throw createValidationError([
        { field: "title", message: "title must be a string" }
      ]);
    }

    if (location !== undefined && typeof location !== "string") {
      throw createValidationError([
        { field: "location", message: "location must be a string" }
      ]);
    }

    if (status !== undefined && !Object.values(JOB_STATUS).includes(status)) {
      throw createValidationError([
        {
          field: "status",
          message: `status must be one of: ${Object.values(JOB_STATUS).join(", ")}`
        }
      ]);
    }

    req.query.page = parsePositiveInteger(page, "page", 1);
    req.query.limit = parsePositiveInteger(limit, "limit", 10, 100);

    next();
  } catch (error) {
    next(error);
  }
}

export function validatePaginationQuery(req, _res, next) {
  try {
    req.query.page = parsePositiveInteger(req.query.page, "page", 1);
    req.query.limit = parsePositiveInteger(req.query.limit, "limit", 10, 100);
    next();
  } catch (error) {
    next(error);
  }
}
