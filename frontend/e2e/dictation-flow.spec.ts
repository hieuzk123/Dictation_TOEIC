import { test, expect } from '@playwright/test';

test.describe('Dictation Workspace Flow', () => {
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
            itemCount: 1,
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
            audioUrl: '/audio/test.mp3',
            totalDuration: 45.0,
            totalSegments: 2,
          },
        ]),
      });
    });

    // Mock item detail API
    await page.route('**/api/items/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          testId: 1,
          part: 3,
          itemNumber: '32-34',
          title: 'Office Supply Toner Order',
          audioUrl: '/audio/test.mp3',
          totalDuration: 45.0,
          totalSegments: 2,
          segments: [
            {
              id: 10,
              itemId: 1,
              segmentIndex: 1,
              speaker: 'Man',
              startTime: 0.0,
              endTime: 4.5,
              fullTranscript: 'Hello world from TOEIC dictation',
              totalWords: 5,
              keywordCount: 2,
              tokens: [
                { word: 'Hello', start: 0.0, end: 0.8, isKeyword: true },
                { word: 'world', start: 0.9, end: 1.5, isKeyword: false },
                { word: 'from', start: 1.6, end: 2.0, isKeyword: false },
                { word: 'TOEIC', start: 2.1, end: 3.0, isKeyword: true },
                { word: 'dictation', start: 3.1, end: 4.5, isKeyword: false },
              ],
            },
            {
              id: 11,
              itemId: 1,
              segmentIndex: 2,
              speaker: 'Woman',
              startTime: 4.6,
              endTime: 8.0,
              fullTranscript: 'Thank you very much',
              totalWords: 4,
              keywordCount: 1,
              tokens: [
                { word: 'Thank', start: 4.6, end: 5.2, isKeyword: true },
                { word: 'you', start: 5.3, end: 5.8, isKeyword: false },
                { word: 'very', start: 5.9, end: 6.5, isKeyword: false },
                { word: 'much', start: 6.6, end: 7.9, isKeyword: false },
              ],
            },
          ],
        }),
      });
    });
  });

  test('should enter dictation workspace and toggle modes', async ({ page }) => {
    await page.goto('/');

    const dismissBtn = page.locator('button:has-text("Đã hiểu & Bắt đầu luyện tập")');
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click();
    }

    // Select practice item
    await page.click('button:has-text("Bắt đầu luyện tập")');

    // Verify workspace loaded
    await expect(page.locator('text=Câu 1 / 2')).toBeVisible();
    await expect(page.locator('text=Chế độ luyện:')).toBeVisible();

    // Toggle reveal answer
    await page.click('button:has-text("Hiện đáp án")');
    await expect(page.locator('text=Hello world from TOEIC dictation')).toBeVisible();
    await page.click('button:has-text("Ẩn đáp án")');

    // Switch to FULL_SENTENCE mode
    await page.click('button:has-text("Cả câu")');
    const textarea = page.locator('textarea[placeholder*="Gõ toàn bộ câu"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Hello world from TOEIC');
    await expect(textarea).toHaveValue('Hello world from TOEIC');

    // Return to list
    await page.click('button:has-text("Chọn bài khác")');
    await expect(page.locator('text=Office Supply Toner Order')).toBeVisible();
  });
});
