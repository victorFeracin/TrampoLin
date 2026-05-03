# API Test Automation

This folder contains the HTTP-level API automation suite for TrampoLin.

## Prerequisites

- Node.js 18 or newer
- npm
- The API running locally at `http://localhost:3000`

## Environment Variables

- `API_BASE_URL`
  - Optional for the test runner
  - Defaults to `http://localhost:3000`
- `JWT_SECRET`
  - Required by the API process
- `JWT_EXPIRES_IN`
  - Optional for the API process
- `ENABLE_TEST_RESET`
  - Required as `true` for deterministic test execution
  - Enables the protected `POST /__test__/reset` route
- `TEST_RESET_SECRET`
  - Shared secret used by the suite to reset the in-memory database
  - Defaults to `local-test-reset-secret` if not overridden

## How To Start The API

Use a test-safe environment so the reset route is available:

```powershell
$env:JWT_SECRET="test-secret"
$env:ENABLE_TEST_RESET="true"
$env:TEST_RESET_SECRET="local-test-reset-secret"
npm start
```

## How To Run The Tests Locally

Run the API in one terminal, then execute the suite in another:

```powershell
npm run test:api
```

To point the suite at a different running server:

```powershell
$env:API_BASE_URL="http://localhost:3000"
npm run test:api
```

## Mochawesome Report

Generate the HTML and JSON report with:

```powershell
npm run test:api:report
```

The report is written to `test-results/mochawesome/`.

## CI Execution

The GitHub Actions workflow:

- installs dependencies with `npm ci`
- starts the API on port `3000`
- enables the protected reset route for deterministic setup
- runs `npm run test:api:ci`
- uploads the Mochawesome report as a build artifact
