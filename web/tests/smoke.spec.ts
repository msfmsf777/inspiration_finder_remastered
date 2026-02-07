import { test, expect } from '@playwright/test';

test('dry-run renders results, opens detail, exports JSON', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('run-button').click();

  const list = page.getByTestId('opportunity-list');
  await expect(list).toBeVisible();

  // Wait for at least 1 opportunity card.
  const cards = page.locator('button.OppCard');
  await expect(cards.first()).toBeVisible();

  await cards.first().click();

  await expect(page.getByTestId('opportunity-detail')).toBeVisible();

  // Export JSON triggers download
  await page.getByRole('button', { name: 'Dashboard' }).click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-json').click(),
  ]);

  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/report-.*\.json/);
});
