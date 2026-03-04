# E2E tests (Playwright)

E2E tests run the app in a real browser to catch issues that unit tests cannot (e.g. app freezes, WebSocket or auth blocking the main thread).

## Run E2E tests

```bash
cd frontend
npm run test:e2e
```

Playwright builds the app (`npm run build`), serves it with `vite preview` on port 4173, and runs the test. If a server is already running on 4173, it is reused. Backend (port 8080) is not required for the app-load test.

## App-load test

`e2e/app-load.spec.ts` checks that the app loads and shows the Welcome screen (heading "Listyyy") within the timeout. If the app freezes or fails to load, the test fails.

The test runs against the **production** build to avoid dev-mode-only freezes (e.g. from SockJS/STOMP or HMR). Lazy-loaded routes and lazy-loaded WebSocket libs keep the initial bundle from blocking the main thread.
