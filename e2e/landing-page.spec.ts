import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders the hero section with branding', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Everything your sports club needs'
    );
    await expect(page).toHaveTitle(/ClubConnect/);
  });

  test('displays all feature cards', async ({ page }) => {
    await page.goto('/');

    const features = [
      'Member Management',
      'Payments & Invoicing',
      'Competitions & Events',
      'Team Management',
      'Documents & Photos',
      'Announcements',
    ];

    for (const feature of features) {
      await expect(page.getByRole('heading', { name: feature })).toBeVisible();
    }
  });

  test('header contains sign in and get started links', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    await expect(header.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/signup'
    );
  });

  test('hero CTA buttons link to auth pages', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /get started free/i })).toHaveAttribute(
      'href',
      '/signup'
    );
  });

  test('footer displays copyright text', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    const year = new Date().getFullYear().toString();
    await expect(footer).toContainText(year);
    await expect(footer).toContainText('ClubConnect');
  });
});
