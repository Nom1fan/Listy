---
name: restart-backend-when-needed
description: Always restart the Spring Boot backend after making backend changes (Java, config, migrations). Run the restart script from project root; never tell the user to restart manually.
---

# Restart Backend

Run from the **project root** after any backend changes:

```bash
./restart-backend.sh
```

## When to restart (always after backend changes)

- Any changes under `backend/` (Java, migrations, `application.properties`, etc.).
- New or modified Flyway migrations, beans, controllers, or endpoints.
- User says the backend needs a restart or something "doesn't work".

## Fallback

If `restart-backend.sh` does not exist but `run-backend.sh` does, stop the running backend (`pkill -f "spring-boot:run"`) then run `./run-backend.sh`.

## Important

- Never say "restart the backend" without actually running the script.
- Run from the project root so relative paths resolve correctly.
