import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('account page redirects to login if not logged in', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/login/);
  });

  test('login shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|error/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin protection', () => {
  test('admin page redirects non-admin to homepage', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect away from admin
    await expect(page).not.toHaveURL('/admin');
  });
});
