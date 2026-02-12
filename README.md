# Listy – List Management App

Hebrew-first (RTL) management list app with categories, product bank, list sharing, and real-time updates. Supports web and Android (Capacitor).

## Features

- **Hebrew (RTL)** – Native right-to-left layout
- **Categories** – Organize items by category with optional icons/images
- **Multiple lists** – Create and switch between lists
- **Cross off items** – Mark items done without removing (red strikethrough)
- **Product bank** – Browse categories and products, add to list with quantity and note
- **Amount and note** – Set quantity/unit and note per item
- **Category and product images** – Default icons, override with upload or URL
- **Sharing** – Invite by email or phone; collaborate on lists
- **Real-time** – WebSocket updates when someone adds/removes/updates; notification shows what changed
- **Auth** – Email/password and phone (SMS OTP via Twilio)
- **Android** – Same app via Capacitor; FCM push when list is updated (when configured)

## Quick start (local)

### Backend

1. **PostgreSQL** – Create DB and user:
   ```bash
   createdb listy
   ```
   **Or restore from a backup:** if the repo has `db/listy-db.sql` (exported from another machine), run `./scripts/import-db.sh` instead. It recreates the `listy` DB and loads the dump.
2. **Config** – In `demo/`, ensure `src/main/resources/application.properties` points to your DB (default: `localhost:5432/listy`, user/pass `postgres`).
3. **Run** (from repo root or any directory):
   ```bash
   ./run-backend.sh
   ```
   Or manually:
   ```bash
   cd demo && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```

### Frontend

1. **Install and run**:
   ```bash
   cd frontend && npm install && npm run dev
   ```
2. Open http://localhost:5173 (Vite proxies `/api` and `/ws` to the backend).

### Try on your phone (same WiFi)

You don’t need to open any port on your router. On your Mac:

1. **Get your Mac’s IP** – When you run `npm run dev`, Vite will print something like `Local: http://192.168.x.x:5173`. Use that IP (or run `ipconfig getifaddr en0` in a terminal).
2. **Allow that origin in the backend** – In the same terminal where you’ll run the backend:
   ```bash
   export CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://192.168.x.x:5173"
   ```
   Replace `192.168.x.x` with the IP from step 1.
3. **Start backend and frontend** (backend already binds to all interfaces with the `local` profile; Vite is configured to listen on all interfaces).
4. **On your phone** – Connect to the same WiFi, then open in the browser: `http://192.168.x.x:5173`.

**If you get “site cannot be reached” on the phone:**

- **Restart the frontend** – Stop `npm run dev` (Ctrl+C) and start it again so Vite picks up `host: true` and listens on the network. You should see both a “Local” and a “Network” URL in the terminal.
- **macOS Firewall** – If your Mac’s firewall is on, it may block incoming connections to Node. Either:
  - **System Settings → Network → Firewall** – Turn it off temporarily to test, or  
  - **Firewall Options** – Add “Node” (or your terminal app) and set it to “Allow incoming connections”.
- **Same WiFi** – Phone must be on the same Wi‑Fi as the Mac (not mobile data).
- **Use the Network URL** – In the terminal where Vite is running, use the **Network:** URL it prints (e.g. `http://192.168.1.5:5173`), not the Local one.

To see your IP and the exact URL/CORS to use, run from the repo root:
- **macOS:** `./scripts/mobile-url.sh`
- **Windows:** run `ipconfig` and use the **IPv4 Address** of your Wi‑Fi adapter (e.g. `192.168.1.10`); then use `http://that-IP:5173` on your phone and add `http://that-IP:5173` to `CORS_ORIGINS` when starting the backend.

### Database backup and restore (move data to another machine)

To take your current DB (lists, users, categories, etc.) to another machine without recreating everything:

1. **On this machine (export):** From repo root run:
   ```bash
   ./scripts/export-db.sh
   ```
   This writes a full dump to `db/listy-db.sql`. Commit and push that file.
2. **On the other machine (import):** After cloning and installing PostgreSQL, run:
   ```bash
   ./scripts/import-db.sh
   ```
   This drops and recreates the `listy` database and loads the dump. Then start the backend as usual.

See `db/README.md` for Windows (pg_dump/psql) and one-liners.

### Run on another PC without the repo (e.g. Windows, no Cursor)

Package everything into a single folder you can zip and run on another machine (backend + frontend + PostgreSQL in Docker; only Docker Desktop needed there):

1. **Export your DB** (optional, so the other PC has your data):
   ```bash
   ./scripts/export-db.sh
   ```
   Commit or copy `db/listy-db.sql` into the package in the next step.

2. **Create the package** (from repo root):
   ```bash
   ./scripts/package-for-windows.sh
   ```
   This builds the app and creates `listy-windows/` with a minimal Docker setup, the JAR, and your DB dump if present.

3. **Zip and copy** to your other PC:
   ```bash
   zip -r listy-windows.zip listy-windows
   ```

4. **On the other PC:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), unzip the folder, then double-click `run.bat` (or run `docker compose up` in that folder). Open http://localhost:8080.

See `listy-windows/README.txt` (inside the package) for details.

## Docker (single server / EC2)

Build and run app + PostgreSQL:

```bash
# Build and start
docker compose up -d

# App: http://localhost:8080
# DB: internal only (port not exposed)
```

Set env for production:

- `JWT_SECRET` – Min 256 bits for HS256 (e.g. 32+ char random string).
- Optionally: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` for phone OTP.

### Deploy on EC2 (e.g. free tier)

1. Launch an Amazon Linux 2 (or Ubuntu) instance (e.g. t2.micro).
2. Install Docker and Docker Compose:
   ```bash
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker && sudo systemctl enable docker
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
3. Clone the repo, set `JWT_SECRET` (and Twilio if needed), then:
   ```bash
   docker compose up -d
   ```
4. Open security group for port 8080 (and 443 if you put nginx in front for TLS).

The image serves the built frontend from the same container; no separate static server needed for a single instance.

## Android build

1. **Frontend** – Build and sync:
   ```bash
   cd frontend && npm run build && npx cap sync android
   ```
2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
3. Configure `capacitor.config.ts` `server.url` for production API (and use env when building the web bundle so API/WS base URLs point to your server).
4. For FCM push: add `google-services.json`, enable FCM in Firebase, and implement `FcmService.sendFcm()` in the backend (e.g. Firebase Admin SDK or FCM HTTP v1).

## Project layout

- **demo/** – Spring Boot backend (REST, WebSocket, auth, lists, product bank, sharing, uploads).
- **frontend/** – React (Vite) + TypeScript; RTL, lists, list detail, product bank, auth (email + phone).
- **frontend/android/** – Capacitor Android project.
- **Dockerfile** – Multi-stage: build frontend, then backend with static assets; run JAR.
- **docker-compose.yml** – App + PostgreSQL + volumes.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login` – Email/password.
- `POST /api/auth/phone/request`, `POST /api/auth/phone/verify` – Phone OTP.
- `GET/POST /api/lists`, `GET/PUT/DELETE /api/lists/:id` – Lists CRUD.
- `GET/POST/PATCH/DELETE /api/lists/:id/items` – List items (quantity, note, crossedOff).
- `GET /api/categories`, `GET /api/products` – Product bank (optional `categoryId`, `search`).
- `POST /api/upload/category/:id`, `POST /api/upload/product/:id` – Image upload (multipart).
- `GET/POST/DELETE /api/lists/:id/members` – Sharing (invite by email/phone).
- **WebSocket** – Connect to `/ws` (SockJS), then subscribe to `/topic/lists/:listId`; send `Authorization: Bearer <jwt>` in CONNECT. Events: `ADDED`, `REMOVED`, `UPDATED` with item and user info.

All authenticated endpoints use header: `Authorization: Bearer <token>`.
