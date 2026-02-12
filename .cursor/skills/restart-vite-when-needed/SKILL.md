---
name: restart-vite-when-needed
description: When a Vite/frontend dev server restart is required (e.g. after vite.config, env or proxy changes), run the project's restart script instead of asking the user. Use when the user or context implies the frontend dev server must be restarted, or after changes that require a restart.
---

# Restart Vite Dev Server When Required

## When to apply

- The user says the frontend or Vite needs a restart, or something "doesn't work until you restart the dev server".
- You made changes that require a Vite restart (e.g. `vite.config.ts`, `.env` or env vars, proxy settings, or other config read at dev server startup).
- You previously said "restart the Vite dev server" or "restart the frontend" and want to do it yourself from now on.

## What to do

1. **If the project has a restart script** (e.g. `restart-frontend.sh` in the repo root):
   - Run it from the **project root**: `./restart-frontend.sh`
   - Use the terminal. The script typically stops the current Vite dev server (e.g. port 5173) and starts it again (foreground or background per project).
   - Do **not** tell the user to restart the frontend manually.

2. **If there is no restart script** but there is a run script (e.g. `run-frontend.sh`):
   - Stop any process on the Vite port (e.g. 5173: `lsof -ti:5173 | xargs kill`) or `pkill -f "vite"`, then run the run script. Prefer adding a `restart-frontend.sh` that stops and then calls the run script, then run it.

## Important

- **Do not** say "restart the Vite dev server" or "you need to restart the frontend" without actually running the restart when you have the ability to run the script.
- Run the restart script from the project root so the script path is correct.
