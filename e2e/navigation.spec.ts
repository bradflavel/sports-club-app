import { test, expect } from '@playwright/test';

test.describe('Navigation Between Pages', () => {
  test('can navigate from landing page to login', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /sign in/i }).first().click();
    await page.waitForURL('**/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('can navigate from landing page to signup', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /get started/i }).first().click();
    await page.waitForURL('**/signup');

    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /sign up/i }).click();
    await page.waitForURL('**/signup');

    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  });

  test('can navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');

    await page.getByRole('link', { name: /sign in/i }).click();
    await page.waitForURL('**/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('can navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /forgot password/i }).click();
    await page.waitForURL('**/forgot-password');

    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
  });

  test('can navigate from forgot password back to login', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.getByRole('link', { name: /back to sign in/i }).click();
    await page.waitForURL('**/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
