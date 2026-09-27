import { test, expect } from '@playwright/test';

test.describe('Home & Practice Item Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock tests API
    await page.route('**/api/tests', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'ETS 2024 - Test 1',
            year: 2024,
            testNumber: 1,
            description: 'Bộ đề thi TOEIC chuẩn ETS',
            itemCount: 2,
          },
        ]),
      });
    });

    // Mock items API
    await page.route('**/api/tests/1/items*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            testId: 1,
            part: 3,
            itemNumber: '32-34',
            title: 'Office Supply Toner Order',
            audioUrl: '/audio/ets2024_test1_part3_q32_34.mp3',
            totalDuration: 45.0,
            totalSegments: 7,
          },
          {
            id: 2,
            testId: 1,
            part: 4,
            itemNumber: '71-73',
            title: 'Airport Flight Delay Announcement',
            audioUrl: '/audio/ets2024_test1_part4_q71_73.mp3',
            totalDuration: 52.0,
            totalSegments: 8,
          },
        ]),
      });
    });
  });

  test('should load home page and handle onboarding modal', async ({ page }) => {
    await page.goto('/');

    const dismissBtn = page.locator('button:has-text("Đã hiểu & Bắt đầu luyện tập")');
    if (await dismissBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await dismissBtn.click();
      await expect(dismissBtn).not.toBeVisible();
    }

    await expect(page.locator('h1')).toContainText('ETS 2024 - Test 1');
    await expect(page.locator('text=/Hiển thị \\d+ \\/ \\d+ bài/')).toBeVisible();
    await expect(page.locator('text=Office Supply Toner Order')).toBeVisible();
    await expect(page.locator('text=Airport Flight Delay Announcement')).toBeVisible();
  });

  test('should search and filter audio items by keyword and part', async ({ page }) => {
    await page.goto('/');

    const dismissBtn = page.locator('button:has-text("Đã hiểu & Bắt đầu luyện tập")');
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    // Search for "Airport"
    const searchInput = page.locator('input[placeholder*="Tìm theo tiêu đề"]');
    await searchInput.fill('Airport');
    await expect(page.locator('text=Airport Flight Delay Announcement')).toBeVisible();
    await expect(page.locator('text=Office Supply Toner Order')).not.toBeVisible();

    // Clear search
    await page.locator('button[title="Xóa tìm kiếm"]').click();
    await expect(searchInput).toHaveValue('');

    // Filter by Part 3 tab
    await page.click('button:has-text("Part 3 (Hội thoại)")');
    await expect(page.locator('text=Office Supply Toner Order')).toBeVisible();
    await expect(page.locator('text=Airport Flight Delay Announcement')).not.toBeVisible();

    // Reset filters
    await page.click('button:has-text("Xóa bộ lọc")');
    await expect(page.locator('text=Airport Flight Delay Announcement')).toBeVisible();
  });
});
