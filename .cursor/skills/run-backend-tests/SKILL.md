---
name: run-backend-tests
description: Run backend (Java/Spring Boot) tests using Maven. Use when running backend tests, verifying backend test results, or executing Maven test commands. NOT for frontend tests — see run-frontend-tests instead.
---

# Running Backend Tests

Uses `./mvnw` from the `backend/` directory. There is no global `mvn` on PATH.

## Commands

Always run from `backend/` working directory.

**All tests:**
```bash
./mvnw test -Dsurefire.useFile=false
```

**Single test class:**
```bash
./mvnw test -Dtest="CategoryIntegrationTest" -Dsurefire.useFile=false
```

**Single test method:**
```bash
./mvnw test -Dtest="CategoryIntegrationTest#category_invite_and_members" -Dsurefire.useFile=false
```

**Pattern matching:**
```bash
./mvnw test -Dtest="*IntegrationTest" -Dsurefire.useFile=false
```

## Notes

- Always use `./mvnw`, never `mvn`.
- Always pass `-Dsurefire.useFile=false` so output goes to stdout.
- Working directory must be `backend/`.
- Pipe through `| tail -30` for quick pass/fail summary when output is long.
