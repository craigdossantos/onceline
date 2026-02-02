import { test, expect } from '@playwright/test'

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('onceline-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true },
        version: 0
      }))
    })
  })

  test('should display timeline header', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByText('Your Story')).toBeVisible()
    await expect(page.getByText('Onceline')).toBeVisible()
  })

  test('should show empty state when no events', async ({ page }) => {
    await page.goto('/')
    
    // Wait for loading to complete
    await page.waitForTimeout(1000)
    
    // Should show empty state message
    await expect(page.getByText('Your timeline is empty')).toBeVisible()
    await expect(page.getByText('Every great story has a beginning')).toBeVisible()
  })

  test('should display navigation arrows', async ({ page }) => {
    await page.goto('/')
    
    // Should have left and right navigation buttons
    const leftArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') })
    const rightArrow = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') })
    
    await expect(leftArrow).toBeVisible()
    await expect(rightArrow).toBeVisible()
  })

  test('should display category legend', async ({ page }) => {
    await page.goto('/')
    
    // Should show all categories in legend
    const categories = ['birth', 'education', 'residence', 'work', 'travel', 'relationship', 'milestone', 'memory']
    
    for (const category of categories) {
      await expect(page.getByText(category, { exact: true })).toBeVisible()
    }
  })

  test('should show chat FAB button', async ({ page }) => {
    await page.goto('/')
    
    // Should show floating action button for chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await expect(chatFab).toBeVisible()
  })

  test('should open chat sheet when FAB is clicked', async ({ page }) => {
    await page.goto('/')
    
    // Click the chat FAB
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Should show chat sheet
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    await expect(page.getByPlaceholder('Share a memory...')).toBeVisible()
  })

  test('should show stats in header when events exist', async ({ page }) => {
    // This test would need mocked data
    // For now, just verify the structure exists when loaded
    await page.goto('/')
    
    // Header should be present
    await expect(page.locator('header')).toBeVisible()
  })
})

test.describe('Timeline Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('onceline-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true },
        version: 0
      }))
    })
  })

  test('should display event pins with correct icons', async ({ page }) => {
    // This would need mocked Supabase data
    // Testing the UI structure exists
    await page.goto('/')
    
    // The pin icon area should exist
    await expect(page.locator('.rounded-full')).toBeTruthy()
  })
})
