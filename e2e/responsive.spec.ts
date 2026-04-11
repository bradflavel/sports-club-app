import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Landing Page', () => {
    test('renders correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');

      // Hero content should be visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();

      // Feature cards should be visible
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible();
    });

    test('renders correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
    });

    test('renders correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Desktop sign-in button in header should be visible
      const header = page.locator('header');
      await expect(header.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Auth Pages', () => {
    test('login form is usable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

      // Form fields should be visible and interactable
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('signup form is usable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/signup');

      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      // All form fields should be visible
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });
  });
});
