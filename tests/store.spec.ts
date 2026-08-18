import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/sneak/i);
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /shop/i }).first()).toBeVisible();
  });
});

test.describe('Shop', () => {
  test('shop page loads', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveURL('/shop');
    const hasProducts = await page.locator('[href^="/shop/"]').count();
    const hasEmpty = await page.getByText(/no products/i).count();
    expect(hasProducts + hasEmpty).toBeGreaterThan(0);
  });
});

test.describe('Cart', () => {
  test('cart page is accessible', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL('/cart');
    const isEmpty = await page.getByText(/empty|no items|start shopping/i).count();
    const hasItems = await page.getByText(/order summary/i).count();
    expect(isEmpty + hasItems).toBeGreaterThan(0);
  });

  test('add to cart from product page', async ({ page }) => {
    await page.goto('/shop');
    const firstProduct = page.locator('a[href^="/shop/"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.click();
      await page.waitForURL(/\/shop\/[^/?]+$/);
      const sizeBtn = page.getByRole('button').filter({ hasText: /US [0-9]/ }).first();
      if (await sizeBtn.count() > 0) {
        await sizeBtn.click();
        const addBtn = page.getByRole('button', { name: /add to (cart|bag)|reserve/i });
        await expect(addBtn).toBeVisible();
        await addBtn.click();
        await expect(page.getByText(/added|cart/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Checkout', () => {
  test('checkout page loads', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL('/checkout');
  });
});
