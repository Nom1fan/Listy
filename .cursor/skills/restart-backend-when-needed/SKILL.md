---
name: restart-backend-when-needed
description: Restart the Spring Boot backend automatically after changes that require it (e.g. Flyway migrations, application.properties, new endpoints or beans). Use when the user or context implies the server must be restarted, or after making changes that require a restart. Never tell the user to restart manually — just do it.
---

# Restart Backend

Run from the **project root**:

```bash
./restart-backend.sh
```

## When to restart

- New or modified Flyway migrations.
- Changes to `application.properties` / `application.yml`.
- New or modified Spring beans, controllers, or endpoints.
- User says the backend needs a restart or something "doesn't work".

## Fallback

If `restart-backend.sh` does not exist but `run-backend.sh` does, stop the running backend (`pkill -f "spring-boot:run"`) then run `./run-backend.sh`.

## Important

- Never say "restart the backend" without actually running the script.
- Run from the project root so relative paths resolve correctly.
