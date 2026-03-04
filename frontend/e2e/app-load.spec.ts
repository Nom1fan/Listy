import { test, expect } from '@playwright/test';

/**
 * Verifies the app loads in a real browser and doesn't freeze.
 * If the app hangs (e.g. WebSocket or auth blocking the main thread), this test will fail by timeout.
 */
test('app loads and shows welcome or login within 15s', async ({ page }) => {
  test.setTimeout(35_000);

  await page.goto('/welcome', { waitUntil: 'load' });

  // Root must get some content (loading or full UI); if app freezes, this times out
  await expect(page.locator('#root')).toContainText(/.+/, { timeout: 5000 });

  // Then we must see full UI (not stuck on loading)
  await expect(page.getByRole('heading', { name: 'Listyyy' })).toBeVisible({ timeout: 25_000 });
});
