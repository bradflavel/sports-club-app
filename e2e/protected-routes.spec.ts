import { test, expect } from '@playwright/test';

test.describe('Protected Route Access Control', () => {
  const protectedRoutes = [
    '/dashboard',
    '/members',
    '/teams',
    '/fixtures',
    '/payments',
    '/documents',
    '/photos',
    '/announcements',
    '/settings',
    '/staff',
    '/shop',
    '/events',
    '/club',
  ];

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route} to login`, async ({ page }) => {
      await page.goto(route);

      // The middleware should redirect to /login
      await page.waitForURL('**/login**');
      expect(page.url()).toContain('/login');

      // Login page should render
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    });
  }

  test('allows unauthenticated access to the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Everything your sports club needs'
    );
    // Should NOT redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('allows unauthenticated access to the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    expect(page.url()).toContain('/login');
  });

  test('allows unauthenticated access to the signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    expect(page.url()).toContain('/signup');
  });

  test('allows unauthenticated access to the forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
    expect(page.url()).toContain('/forgot-password');
  });
});
