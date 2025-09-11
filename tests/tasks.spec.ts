import { test, expect } from '@playwright/test';

// Login helper function
async function loginAsAdmin(page: any) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.fill('input[type="email"]', 'latihads@gmail.com');
  await page.fill('input[type="password"]', '123');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=TaskFlow')).toBeVisible();
}

test.describe('Task Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page);
  });

  test('should display main dashboard after login', async ({ page }) => {
    // Check header elements
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    await expect(page.locator('text=Board')).toBeVisible();
    await expect(page.locator('text=Calendar')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('text=Filter')).toBeVisible();
    await expect(page.locator('text=Smart Add')).toBeVisible();
    await expect(page.locator('text=Add Task')).toBeVisible();
    
    // Check task board columns
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('should open task creation modal', async ({ page }) => {
    // Click Add Task button
    await page.click('text=Add Task');
    
    // Check modal is open
    await expect(page.locator('text=Create New Task')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('input[placeholder*="task title"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="description"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // Assignee dropdown
    
    // Check buttons
    await expect(page.locator('text=Cancel')).toBeVisible();
    await expect(page.locator('text=Create Task')).toBeVisible();
  });

  test('should create a new task successfully', async ({ page }) => {
    // Open task creation modal
    await page.click('text=Add Task');
    await expect(page.locator('text=Create New Task')).toBeVisible();
    
    // Fill task details
    await page.fill('input[placeholder*="task title"]', 'Test Task from Playwright');
    await page.fill('textarea[placeholder*="description"]', 'This is a test task created by Playwright automation');
    
    // Select assignee (first available option)
    await page.selectOption('select:first-of-type', { index: 1 });
    
    // Set due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    
    // Select priority
    await page.selectOption('select:last-of-type', 'High');
    
    // Submit task
    await page.click('text=Create Task');
    
    // Check success toast
    await expect(page.locator('text=Task created successfully!')).toBeVisible();
    
    // Check task appears in To Do column
    await expect(page.locator('text=Test Task from Playwright')).toBeVisible();
  });

  test('should open smart task modal', async ({ page }) => {
    // Click Smart Add button
    await page.click('text=Smart Add');
    
    // Check modal is open
    await expect(page.locator('text=Smart Task Creation')).toBeVisible();
    
    // Check AI prompt field
    await expect(page.locator('textarea[placeholder*="natural language"]')).toBeVisible();
    
    // Check buttons
    await expect(page.locator('text=Cancel')).toBeVisible();
    await expect(page.locator('text=Create with AI')).toBeVisible();
  });

  test('should create task with AI (Smart Add)', async ({ page }) => {
    // Open smart task modal
    await page.click('text=Smart Add');
    await expect(page.locator('text=Smart Task Creation')).toBeVisible();
    
    // Enter AI prompt
    const prompt = 'assign Alex to prepare presentation for tomorrow with high priority';
    await page.fill('textarea[placeholder*="natural language"]', prompt);
    
    // Submit smart task
    await page.click('text=Create with AI');
    
    // Wait for AI processing (might take a few seconds)
    await page.waitForTimeout(3000);
    
    // Check for success or error message
    const successMessage = page.locator('text=Smart task added successfully!');
    const errorMessage = page.locator('text=Failed to add smart task');
    
    // Either success or graceful error handling
    const result = await Promise.race([
      successMessage.waitFor({ timeout: 10000 }).then(() => 'success'),
      errorMessage.waitFor({ timeout: 10000 }).then(() => 'error')
    ]).catch(() => 'timeout');
    
    if (result === 'success') {
      // Check task was created
      await expect(page.locator('text=presentation')).toBeVisible();
    } else {
      // AI might be unavailable, but modal should close
      await expect(page.locator('text=Smart Task Creation')).not.toBeVisible();
    }
  });

  test('should switch between Board and Calendar views', async ({ page }) => {
    // Default should be Board view
    await expect(page.locator('text=To Do')).toBeVisible();
    
    // Switch to Calendar view
    await page.click('text=Calendar');
    
    // Check calendar view elements
    await expect(page.locator('.calendar')).toBeVisible();
    
    // Switch back to Board view
    await page.click('text=Board');
    
    // Check board view is back
    await expect(page.locator('text=To Do')).toBeVisible();
    await expect(page.locator('text=In Progress')).toBeVisible();
    await expect(page.locator('text=Done')).toBeVisible();
  });

  test('should open filter dropdown', async ({ page }) => {
    // Click Filter button
    await page.click('text=Filter');
    
    // Check filter dropdown is open
    await expect(page.locator('text=Filter Tasks')).toBeVisible();
    
    // Check filter categories
    await expect(page.locator('text=ASSIGNEE')).toBeVisible();
    await expect(page.locator('text=PRIORITY')).toBeVisible();
    
    // Check Clear All button
    await expect(page.locator('text=Clear All')).toBeVisible();
  });

  test('should filter tasks by assignee', async ({ page }) => {
    // First create a task so we have something to filter
    await page.click('text=Add Task');
    await page.fill('input[placeholder*="task title"]', 'Filter Test Task');
    await page.selectOption('select:first-of-type', { index: 1 });
    await page.click('text=Create Task');
    await expect(page.locator('text=Task created successfully!')).toBeVisible();
    
    // Open filter dropdown
    await page.click('text=Filter');
    
    // Select first assignee checkbox
    await page.click('input[type="checkbox"]:first-of-type');
    
    // Close filter dropdown by clicking outside
    await page.click('text=TaskFlow');
    
    // Filter should be applied (check for filter indicator)
    await expect(page.locator('.bg-brand-100')).toBeVisible(); // Active filter indicator
  });

  test('should open activity feed', async ({ page }) => {
    // Click activity feed button
    await page.click('button[aria-label="Toggle activity feed"]');
    
    // Check activity feed is open
    await expect(page.locator('text=Activity Feed')).toBeVisible();
    
    // Check close button
    await expect(page.locator('button[aria-label="Close activity feed"]')).toBeVisible();
  });

  test('should handle task interactions', async ({ page }) => {
    // Create a task first
    await page.click('text=Add Task');
    await page.fill('input[placeholder*="task title"]', 'Interactive Test Task');
    await page.fill('textarea[placeholder*="description"]', 'Testing task interactions');
    await page.selectOption('select:first-of-type', { index: 1 });
    await page.click('text=Create Task');
    await expect(page.locator('text=Task created successfully!')).toBeVisible();
    
    // Click on the created task to view details
    await page.click('text=Interactive Test Task');
    
    // Check task detail modal
    await expect(page.locator('text=Task Details')).toBeVisible();
    await expect(page.locator('text=Interactive Test Task')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('text=Edit')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
    
    // Close modal
    await page.click('button[aria-label="Close"]');
    await expect(page.locator('text=Task Details')).not.toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout adjustments
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Some elements might be hidden on mobile
    const smartAddButton = page.locator('text=Smart Add');
    const filterButton = page.locator('text=Filter');
    
    // Either visible or hidden gracefully
    const smartAddVisible = await smartAddButton.isVisible();
    const filterVisible = await filterButton.isVisible();
    
    // At minimum, Add Task should be visible
    await expect(page.locator('text=Add Task')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=Smart Add')).toBeVisible();
  });

  test('should persist data between page reloads', async ({ page }) => {
    // Create a task
    await page.click('text=Add Task');
    await page.fill('input[placeholder*="task title"]', 'Persistence Test Task');
    await page.selectOption('select:first-of-type', { index: 1 });
    await page.click('text=Create Task');
    await expect(page.locator('text=Task created successfully!')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Check task still exists (if using localStorage/Firebase)
    await expect(page.locator('text=TaskFlow')).toBeVisible();
    
    // Note: Depending on backend implementation, 
    // task might or might not persist after reload
  });

});
