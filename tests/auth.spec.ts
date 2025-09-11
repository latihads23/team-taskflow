import { test, expect } from '@playwright/test';

// Test data
const TEST_ACCOUNTS = {
  admin: {
    email: 'latihads@gmail.com',
    password: '123',
    name: 'Haris Latifa',
    role: 'admin'
  },
  user1: {
    email: 'alex.johnson@example.com',
    password: 'password123',
    name: 'Alex Johnson',
    role: 'user'
  },
  user2: {
    email: 'maria.garcia@example.com',
    password: 'password123',
    name: 'Maria Garcia',
    role: 'user'
  },
  invalid: {
    email: 'wrong@test.com',
    password: 'wrongpassword'
  }
};

test.describe('Authentication System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display login page on initial load', async ({ page }) => {
    await page.goto('/');
    
    // Check login page elements
    await expect(page.locator('h2')).toContainText('Team TaskFlow');
    await expect(page.locator('p')).toContainText('Sign in to your account to continue');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
    
    // Check demo accounts section
    await expect(page.locator('text=Show Demo Accounts')).toBeVisible();
  });

  test('should show demo accounts when clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click show demo accounts
    await page.click('text=Show Demo Accounts');
    
    // Check all demo accounts are visible
    await expect(page.locator('text=Haris Latifa')).toBeVisible();
    await expect(page.locator('text=Alex Johnson')).toBeVisible();
    await expect(page.locator('text=Maria Garcia')).toBeVisible();
    
    // Check role badges
    await expect(page.locator('.bg-red-100.text-red-800')).toContainText('admin');
    await expect(page.locator('.bg-green-100.text-green-800')).toContainText('user');
  });

  test('should auto-fill credentials when demo account is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Show demo accounts
    await page.click('text=Show Demo Accounts');
    
    // Click on Haris Latifa account
    await page.click('text=Haris Latifa');
    
    // Check if fields are auto-filled
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveValue(TEST_ACCOUNTS.admin.email);
    await expect(passwordInput).toHaveValue(TEST_ACCOUNTS.admin.password);
    
    // Demo accounts should be hidden
    await expect(page.locator('text=Haris Latifa')).not.toBeVisible();
  });

  test('should successfully login with admin account', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for loading to finish
    await expect(page.locator('text=Signing in...')).toBeVisible();
    
    // Wait for redirect to dashboard
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    await expect(page.url()).not.toContain('login');
    
    // Check welcome toast
    await expect(page.locator('text=Welcome back, Haris Latifa!')).toBeVisible();
  });

  test('should successfully login with user account', async ({ page }) => {
    await page.goto('/');
    
    // Fill login form with user account
    await page.fill('input[type="email"]', TEST_ACCOUNTS.user1.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.user1.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    await expect(page.url()).not.toContain('login');
    
    // Check welcome toast
    await expect(page.locator('text=Welcome back, Alex Johnson!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill with invalid credentials
    await page.fill('input[type="email"]', TEST_ACCOUNTS.invalid.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.invalid.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for loading
    await expect(page.locator('text=Signing in...')).toBeVisible();
    
    // Check error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Should remain on login page
    await expect(page.locator('h2')).toContainText('Team TaskFlow');
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check validation error
    await expect(page.locator('text=Please fill in all fields')).toBeVisible();
  });

  test('should display user dropdown menu after login', async ({ page }) => {
    await page.goto('/');
    
    // Login as admin
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Click user avatar
    await page.click('img[alt="Haris Latifa"]');
    
    // Check dropdown content
    await expect(page.locator('text=Haris Latifa')).toBeVisible();
    await expect(page.locator('text=latihads@gmail.com')).toBeVisible();
    await expect(page.locator('text=admin')).toBeVisible();
    await expect(page.locator('text=Profile Settings')).toBeVisible();
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    await page.goto('/');
    
    // Login first
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Click user avatar and logout
    await page.click('img[alt="Haris Latifa"]');
    await page.click('text=Sign Out');
    
    // Check redirect to login page
    await expect(page.locator('h2')).toContainText('Team TaskFlow');
    
    // Check goodbye toast
    await expect(page.locator('text=Goodbye, Haris Latifa!')).toBeVisible();
  });

  test('should persist session after page refresh', async ({ page }) => {
    await page.goto('/');
    
    // Login as admin
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    await expect(page.locator('img[alt="Haris Latifa"]')).toBeVisible();
  });

  test('should clear session after logout and refresh', async ({ page }) => {
    await page.goto('/');
    
    // Login and logout
    await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Logout
    await page.click('img[alt="Haris Latifa"]');
    await page.click('text=Sign Out');
    
    // Refresh page
    await page.reload();
    
    // Should be on login page
    await expect(page.locator('h2')).toContainText('Team TaskFlow');
  });

});
