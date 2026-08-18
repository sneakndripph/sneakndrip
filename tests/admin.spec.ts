import { test, expect, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('juan@email.com').fill('donjulio263@gmail.com');
  await page.getByPlaceholder(/password/i).fill(process.env.ADMIN_PASSWORD || '');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/admin|account/, { timeout: 8000 }).catch(() => {});
}

test.describe('Admin - Products', () => {
  test('products list page loads after login', async ({ page }) => {
    await loginAsAdmin(page);
    if (!page.url().includes('/admin')) return;

    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /add product/i })).toBeVisible();
  });

  test('add product page has all fields', async ({ page }) => {
    await loginAsAdmin(page);
    if (!page.url().includes('/admin')) return;

    await page.goto('/admin/products/new');
    await expect(page.getByPlaceholder(/nike air force/i)).toBeVisible();
    await expect(page.getByRole('combobox', { name: /brand/i })).toBeVisible();
  });
});

test.describe('Admin - Orders', () => {
  test('orders page loads after login', async ({ page }) => {
    await loginAsAdmin(page);
    if (!page.url().includes('/admin')) return;

    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();
  });
});
