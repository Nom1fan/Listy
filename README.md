# Listy – Grocery List App

Hebrew-first (RTL) grocery list app with categories, product bank, list sharing, and real-time updates. Supports web and Android (Capacitor).

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
