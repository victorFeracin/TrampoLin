let sequence = 0;

function nextSequence(prefix) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export function buildUserPayload(overrides = {}) {
  const role = overrides.role || "candidate";
  const unique = nextSequence(role);

  return {
    name: `${role} ${unique}`,
    email: `${unique}@example.com`,
    password: "StrongPass123",
    role,
    ...overrides
  };
}

export function buildJobPayload(overrides = {}) {
  const unique = nextSequence("job");

  return {
    title: `QA Role ${unique}`,
    description: `Automation-focused role for ${unique}`,
    location: "Sao Paulo, BR",
    salary: 8500,
    status: "open",
    ...overrides
  };
}

export function buildApplicationPayload(overrides = {}) {
  const unique = nextSequence("resume");

  return {
    resumeUrl: `https://example.com/resumes/${unique}.pdf`,
    ...overrides
  };
}
