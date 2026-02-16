# Listyyy – List Management App

Hebrew-first (RTL) list management app with categories, product bank, list sharing, and real-time updates. Supports web and Android (Capacitor).

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

## Project layout

- **backend/** – Spring Boot backend (REST, WebSocket, auth, lists, product bank, sharing, uploads).
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
