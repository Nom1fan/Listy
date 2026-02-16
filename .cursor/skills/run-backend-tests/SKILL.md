---
name: run-backend-tests
description: Run backend (Java/Spring Boot) tests. Use when running backend tests, verifying backend test results, or executing Maven commands. NOT for frontend tests — see run-frontend-tests instead.
---

# Running Backend Tests

This project uses the Maven wrapper (`./mvnw`) located in the `backend/` directory. There is no global `mvn` on PATH.

## Commands

Always run from the `backend/` working directory.

**Run all tests:**
```bash
./mvnw test -Dsurefire.useFile=false
```

**Run a single test class:**
```bash
./mvnw test -Dtest="CategoryIntegrationTest" -Dsurefire.useFile=false
```

**Run a single test method:**
```bash
./mvnw test -Dtest="CategoryIntegrationTest#category_invite_and_members" -Dsurefire.useFile=false
```

**Run tests matching a pattern:**
```bash
./mvnw test -Dtest="*IntegrationTest" -Dsurefire.useFile=false
```

## Notes

- Always use `./mvnw`, never `mvn`.
- Always pass `-Dsurefire.useFile=false` so test output goes to stdout.
- Working directory must be `backend/` (where `mvnw` lives).
- Pipe through `| tail -30` for quick pass/fail summary when output is long.
