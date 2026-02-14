# Listyyy – Dev & Operations Guide

Internal reference for running locally, deploying, releasing, and building Android.

## Quick start (local)

### Backend

1. **PostgreSQL** – Create DB and user:
   ```bash
   createdb listyyy
   ```
   **Or restore from a backup:** if the repo has `db/listyyy-db.sql` (exported from another machine), run `./scripts/import-db.sh` instead. It recreates the `listyyy` DB and loads the dump.
2. **Config** – In `backend/`, ensure `src/main/resources/application.properties` points to your DB (default: `localhost:5432/listyyy`, user/pass `postgres`).
3. **Run** (from repo root or any directory):
   ```bash
   ./run-backend.sh
   ```
   Or manually:
   ```bash
   cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```

### Frontend

1. **Install and run**:
   ```bash
   cd frontend && npm install && npm run dev
   ```
2. Open http://localhost:5173 (Vite proxies `/api` and `/ws` to the backend).

### Try on your phone (same WiFi)

You don't need to open any port on your router. On your Mac:

1. **Get your Mac's IP** – When you run `npm run dev`, Vite will print something like `Local: http://192.168.x.x:5173`. Use that IP (or run `ipconfig getifaddr en0` in a terminal).
2. **Allow that origin in the backend** – In the same terminal where you'll run the backend:
   ```bash
   export CORS_ORIGINS="http://localhost:5173,http://localhost:3000,http://192.168.x.x:5173"
   ```
   Replace `192.168.x.x` with the IP from step 1.
3. **Start backend and frontend** (backend already binds to all interfaces with the `local` profile; Vite is configured to listen on all interfaces).
4. **On your phone** – Connect to the same WiFi, then open in the browser: `http://192.168.x.x:5173`.

**If you get "site cannot be reached" on the phone:**

- **Restart the frontend** – Stop `npm run dev` (Ctrl+C) and start it again so Vite picks up `host: true` and listens on the network. You should see both a "Local" and a "Network" URL in the terminal.
- **macOS Firewall** – If your Mac's firewall is on, it may block incoming connections to Node. Either:
  - **System Settings → Network → Firewall** – Turn it off temporarily to test, or  
  - **Firewall Options** – Add "Node" (or your terminal app) and set it to "Allow incoming connections".
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
   This writes a full dump to `db/listyyy-db.sql`. Commit and push that file.
2. **On the other machine (import):** After cloning and installing PostgreSQL, run:
   ```bash
   ./scripts/import-db.sh
   ```
   This drops and recreates the `listyyy` database and loads the dump. Then start the backend as usual.

See `db/README.md` for Windows (pg_dump/psql) and one-liners.

### Run on another PC without the repo (e.g. Windows, no Cursor)

Package everything into a single folder you can zip and run on another machine (backend + frontend + PostgreSQL in Docker; only Docker Desktop needed there):

1. **Export your DB** (optional, so the other PC has your data):
   ```bash
   ./scripts/export-db.sh
   ```
   Commit or copy `db/listyyy-db.sql` into the package in the next step.

2. **Create the package** (from repo root):
   ```bash
   ./scripts/package-for-windows.sh
   ```
   This builds the app and creates `listyyy-windows/` with a minimal Docker setup, the JAR, and your DB dump if present.

3. **Zip and copy** to your other PC:
   ```bash
   zip -r listyyy-windows.zip listyyy-windows
   ```

4. **On the other PC:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), unzip the folder, then double-click `run.bat` (or run `docker compose up` in that folder). Open http://localhost:8080.

See `listyyy-windows/README.txt` (inside the package) for details.

## Docker (single server / EC2)

Build and run app + PostgreSQL locally:

```bash
docker compose up -d
# App: http://localhost:8080
```

### Deploy on EC2 (e.g. free tier)

One-time instance setup. After this, `./scripts/release.sh` handles build, push, and deploy automatically (see [Release & deploy](#release--deploy-automated)).

**1. Launch EC2** – Amazon Linux 2 or Ubuntu (e.g. t2.micro). Save the `.pem` key pair.

**2. Install Docker** on the instance

SSH in: `ssh -i your-key.pem ec2-user@<ip>` (use `ubuntu@...` on Ubuntu).

Amazon Linux 2:

```bash
sudo yum update -y && sudo yum install -y docker
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker ec2-user
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -sSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

Ubuntu:

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Log out and back in (or new SSH session). Verify: `docker compose version`.

**3. Open port 8080** in the security group attached to your instance (EC2 → Instances → select instance → Security tab → open the group → Inbound rules → Edit → Add rule: Custom TCP, port 8080, Source `0.0.0.0/0`). Add port 443 if you put nginx in front for HTTPS.

**Firewall notes:** WebSockets share port 8080 — no extra rule. SMS (Twilio) is outbound-only; no inbound rule needed.

**Viewing logs** – From `~/listyyy` on the instance:
- `docker compose logs -f app` – stream stdout (Ctrl+C to stop).
- `docker compose exec app tail -f /app/logs/spring.log` – log file.

That's it for EC2 setup. Building, pushing, deploying, and DB sync are all handled by the scripts below.

## Release & deploy (automated)

Bumps the version, builds, pushes the Docker image, git tags, and deploys to EC2 — all in one command. On first run the scripts prompt for any missing config (image name, `.pem` path, EC2 host, JWT secret) and save it for future runs.

**Prerequisites:** Docker Desktop running and `docker login` done. An EC2 instance with Docker installed (see [EC2 setup](#deploy-on-ec2-eg-free-tier) above).

### Full release

```bash
./scripts/release.sh
```

This runs the full pipeline:

| Step | What happens |
|------|-------------|
| 0 | Bump minor version (e.g. `0.3.0` → `0.4.0`) in `VERSION`, `pom.xml`, `package.json` |
| 1 | Export local DB to `db/listyyy-db.sql` |
| 2–3 | Build Windows package and zip |
| 4 | Build and push Docker image (`LISTYYY_IMAGE:version`) |
| 5 | Git commit, tag `vX.Y.Z`, and push |
| 6 | Deploy to EC2 (SCP compose file, update remote `.env`, pull image, restart) |

**Flags:**

| Flag | Effect |
|------|--------|
| `--db` | Include DB dump in deployment (SCP to EC2 + import) |
| `--windows` | Also build the Windows package and zip |
| `--skip-deploy` | Skip EC2 deployment (build and push only) |

Examples:

```bash
./scripts/release.sh --db              # release + deploy + sync DB
./scripts/release.sh --windows         # also build the Windows package
./scripts/release.sh --skip-deploy     # build and push only, no EC2
```

### Deploy only (no release)

Re-deploy the current version (or a specific one) without bumping or building:

```bash
./scripts/deploy.sh                    # deploy current VERSION
./scripts/deploy.sh --db               # deploy + sync DB
./scripts/deploy.sh --version 0.3.0    # deploy a specific version
```

The deploy script:
1. SCPs `docker-compose.prod.yml` to EC2
2. Updates the remote `.env` with the new `LISTYYY_IMAGE` tag (creates it on first deploy)
3. Pulls the image and runs `docker compose up -d`
4. If `--db`: waits for DB health, then runs `import-db-ec2.sh` on the instance

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
