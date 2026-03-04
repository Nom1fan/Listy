import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run in a real browser. Use them to verify the app actually loads
 * and doesn't freeze (e.g. after WebSocket or auth changes).
 *
 * Run: npm run test:e2e
 * Requires: frontend dev server (started automatically unless already running).
 * Backend (port 8080) is optional for the app-load test; needed for login flows.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Use production build so the app loads without dev-mode freeze; no backend required for app-load test
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
