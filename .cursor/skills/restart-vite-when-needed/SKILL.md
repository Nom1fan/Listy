---
name: restart-vite-when-needed
description: Restart the Vite frontend dev server automatically after changes that require it (e.g. vite.config.ts, .env files, proxy settings). Use when the user or context implies the frontend dev server must be restarted, or after making changes that require a restart. Never tell the user to restart manually — just do it.
---

# Restart Vite Dev Server

Run from the **project root**:

```bash
./restart-frontend.sh
```

## When to restart

- Changes to `vite.config.ts`.
- Changes to `.env` or environment variables.
- Changes to proxy settings or other config read at dev server startup.
- User says the frontend or Vite needs a restart.

## Fallback

If `restart-frontend.sh` does not exist but `run-frontend.sh` does, stop Vite (`lsof -ti:5173 | xargs kill` or `pkill -f "vite"`) then run `./run-frontend.sh`.

## Important

- Never say "restart the frontend" without actually running the script.
- Run from the project root so relative paths resolve correctly.
