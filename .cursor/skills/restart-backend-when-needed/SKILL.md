---
name: restart-backend-when-needed
description: When a backend restart is required (e.g. after DB migrations, config or code changes), run the project's restart script instead of asking the user. Use when the user or context implies the server must be restarted, or after changes that require a restart.
---

# Restart Backend When Required

## When to apply

- The user says the backend needs a restart, or something "doesn't work until you restart".
- You made changes that require a restart (e.g. new Flyway migrations, `application.properties`, new endpoints or beans).
- You previously said "restart the backend" or "restart the server" and want to do it yourself from now on.

## What to do

1. **If the project has a restart script** (e.g. `restart-backend.sh` in the repo root):
   - Run it from the **project root**: `./restart-backend.sh`
   - Use the terminal. The script typically stops the current backend and starts it again (foreground or background per project).
   - Do **not** tell the user to restart manually.

2. **If there is no restart script** but there is a run script (e.g. `run-backend.sh`):
   - Stop any running backend (e.g. `pkill -f "spring-boot:run"` or kill the process on the app port), then run the run script. Prefer adding a `restart-backend.sh` that stops and then calls the run script, then run it.

## Important

- **Do not** say "restart the backend" or "you need to restart the server" without actually running the restart when you have the ability to run the script.
- Run the restart script from the project root so the script path is correct.
