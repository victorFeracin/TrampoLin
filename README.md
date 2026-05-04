# TrampoLin

REST API for job postings and applications with JWT authentication and role-based access for `candidate` and `recruiter` users.

## Stack

- Node.js 18+
- Express
- JWT (`jsonwebtoken`)
- `bcryptjs`
- Mocha, Chai, Supertest, Mochawesome

## Features

- User registration and login
- Authenticated profile lookup
- Public job listing and job details
- Recruiter-only job creation, update, and deletion
- Candidate-only job applications
- Candidate application history
- Recruiter access to applications for their own jobs

## Run locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=3000
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1d
ENABLE_TEST_RESET=false
TEST_RESET_SECRET=local-test-reset-secret
```

Start the API:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Default URL:

```text
http://localhost:3000
```

## API

Public routes:

- `POST /auth/register`
- `POST /auth/login`
- `GET /jobs`
- `GET /jobs/:id`

Protected routes:

- `GET /auth/me`
- `POST /jobs`
- `PUT /jobs/:id`
- `DELETE /jobs/:id`
- `POST /jobs/:id/apply`
- `GET /applications/me`
- `GET /jobs/:id/applications`

## Tests

Run API tests:

```bash
npm run test:api
```

Generate the HTML report:

```bash
npm run test:api:report
```

Reports are written to `test-results/mochawesome/`.

For deterministic tests, enable:

```env
ENABLE_TEST_RESET=true
```

This exposes `POST /__test__/reset` for the automated suite

## Docs

OpenAPI spec:

```text
docs/openapi.yaml
```

## Notes

- The project currently uses in-memory storage
- Data is reset when the server restarts
- CI runs the API suite on `test`, `dev`, and `main` branches
