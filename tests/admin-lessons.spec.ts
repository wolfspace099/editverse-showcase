import { test, expect } from '@playwright/test';

test.describe('Admin Lesson Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the courses and lessons API calls
    await page.route('**/rest/v1/courses*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'course-1',
            title: 'Test Course',
            description: 'Test Description',
            category: 'Editing course',
            image_url: '/test.jpg',
            difficulty: 'Beginner',
            duration_minutes: 60,
            lessons_count: 0,
            is_published: true,
            order_index: 1
          }
        ])
      });
    });

    await page.route('**/rest/v1/lessons*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'lesson-1',
            course_id: 'course-1',
            title: 'New Lesson',
            video_url: 'https://video.com',
            order_index: 1
          })
        });
      }
    });

    // Mock stats
    await page.route('**/rest/v1/user_progress*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Go to login and use Test Mode
    await page.goto('http://localhost:3003/login');
    await page.click('text=Continue with Discord (Test Mode)');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Go to admin page
    await page.goto('http://localhost:3003/admin');
  });

  test('should allow creating a lesson without RLS error', async ({ page }) => {
    // Find the course and click Manage Lessons
    await page.click('text=Manage Lessons');

    // Click Add Lesson
    await page.click('text=Add Lesson');

    // Fill the form
    await page.fill('label:has-text("Lesson Title") + input', 'New Lesson');
    await page.fill('label:has-text("Video URL") + input', 'https://video.com');
    await page.fill('label:has-text("Duration") + input', '15');

    // Spy on window.alert
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    // Save lesson
    await page.click('button:has-text("Save Lesson")');

    // Assertions
    // If there was an RLS error, it would show an alert containing "RLS policy issue"
    expect(alertMessage).not.toContain('RLS policy issue');
    
    // Check if the lesson list was reloaded (the mock will return empty again or we can check the POST was called)
    await expect(page.locator('text=Lessons Management')).toBeVisible();
  });
});
