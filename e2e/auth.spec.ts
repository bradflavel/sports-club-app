import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test.describe('Login Page', () => {
    test('renders login form with all fields', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('shows validation errors for empty submission', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('shows validation error for invalid email', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('not-an-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    });

    test('has link to sign up page', async ({ page }) => {
      await page.goto('/login');

      const signupLink = page.getByRole('link', { name: /sign up/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', '/signup');
    });

    test('has link to forgot password page', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('displays loading spinner during submission', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('password123');

      // Intercept the Supabase auth request to delay the response
      await page.route('**/auth/v1/token*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      });

      await page.getByRole('button', { name: /sign in/i }).click();

      // Button should be disabled while loading
      await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled();
    });
  });

  test.describe('Signup Page', () => {
    test('renders signup form with all fields', async ({ page }) => {
      await page.goto('/signup');

      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('shows validation errors for empty submission', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/last name is required/i)).toBeVisible();
    });

    test('shows error when password is too short', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('short');
      await page.getByLabel(/confirm password/i).fill('short');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('shows error when password lacks a number', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('longpassword');
      await page.getByLabel(/confirm password/i).fill('longpassword');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/password must contain at least one number/i)).toBeVisible();
    });

    test('shows error when passwords do not match', async ({ page }) => {
      await page.goto('/signup');

      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByLabel(/confirm password/i).fill('different123');

      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test('has link to login page', async ({ page }) => {
      await page.goto('/signup');

      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  test.describe('Forgot Password Page', () => {
    test('renders reset password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('has link back to login', async ({ page }) => {
      await page.goto('/forgot-password');

      const backLink = page.getByRole('link', { name: /back to sign in/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/login');
    });

    test('submit button is disabled when email is empty', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByRole('button', { name: /send reset link/i })).toBeDisabled();
    });

    test('submit button enables when email is entered', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByLabel(/email/i).fill('test@example.com');
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeEnabled();
    });
  });
});
