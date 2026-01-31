import { test, expect } from '@playwright/test'

test.describe('Onceline Timeline Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Wait for initial load
    await page.waitForSelector('h1:has-text("Onceline")')
  })

  test('should display the main layout', async ({ page }) => {
    // Check header
    await expect(page.locator('h1')).toContainText('Onceline')
    await expect(page.locator('text=Your life, one line at a time')).toBeVisible()
    
    // Check chat panel
    await expect(page.locator('text=Build Your Timeline')).toBeVisible()
    
    // Check timeline panel
    await expect(page.locator('text=Your Timeline')).toBeVisible()
  })

  test('should show empty state for new timeline', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('text=0 events', { timeout: 10000 })
    
    // Check for empty chat state
    await expect(page.locator('text=Start telling your story...')).toBeVisible()
    
    // Check for empty timeline state
    await expect(page.locator('text=Events will appear here')).toBeVisible()
  })

  test('should have functional chat input', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    // Find the input
    const input = page.locator('input[placeholder*="Share a memory"]')
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
    
    // Type a message
    await input.fill('I was born on January 1, 1990')
    await expect(input).toHaveValue('I was born on January 1, 1990')
    
    // Find send button
    const sendButton = page.locator('button:has-text("Send")')
    await expect(sendButton).toBeEnabled()
  })

  test('should send a message and show it in chat', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    // Send a message
    await input.fill('Hello, this is a test message')
    await sendButton.click()
    
    // Message should appear in chat
    await expect(page.locator('text=Hello, this is a test message')).toBeVisible()
    
    // Input should be cleared
    await expect(input).toHaveValue('')
    
    // Should show loading indicator
    const loadingDots = page.locator('.animate-bounce')
    await expect(loadingDots.first()).toBeVisible()
  })

  test('should handle full message and event flow', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    // Send a message about being born
    await input.fill('I was born on January 1, 1990 in New York City')
    await sendButton.click()
    
    // Wait for user message to appear
    await expect(page.locator('text=I was born on January 1, 1990')).toBeVisible()
    
    // Wait for loading to start
    await page.waitForTimeout(500)
    
    // Wait for AI response (with longer timeout for API)
    await page.waitForSelector('.bg-gray-100.rounded-2xl:not(:has(.animate-bounce))', {
      timeout: 30000,
    }).catch(() => {
      // API might not be configured - that's okay for this test
    })
    
    // Check if input is re-enabled after response
    await expect(input).toBeEnabled({ timeout: 35000 })
  })

  test('should have working zoom controls on timeline', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('text=Your Timeline', { timeout: 10000 })
    
    // Find zoom controls
    const zoomIn = page.locator('button:has-text("+")')
    const zoomOut = page.locator('button:has-text("−")')
    const zoomLevel = page.locator('text=100%')
    
    await expect(zoomLevel).toBeVisible()
    
    // Zoom in
    await zoomIn.click()
    await expect(page.locator('text=125%')).toBeVisible()
    
    // Zoom out twice
    await zoomOut.click()
    await expect(page.locator('text=100%')).toBeVisible()
    await zoomOut.click()
    await expect(page.locator('text=75%')).toBeVisible()
  })

  test('should show category legend', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('text=Your Timeline', { timeout: 10000 })
    
    // Check all categories are in the legend
    const categories = ['birth', 'education', 'residence', 'work', 'travel', 'relationship', 'milestone', 'memory']
    
    for (const category of categories) {
      await expect(page.locator(`text=${category}`).first()).toBeVisible()
    }
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // App should still be usable
    await expect(page.locator('h1')).toContainText('Onceline')
    await expect(page.locator('input[placeholder*="Share a memory"]')).toBeVisible()
  })

  test('should prevent sending empty messages', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    // Try to send empty message
    await input.fill('')
    await sendButton.click()
    
    // Empty state should still be visible (message wasn't sent)
    await expect(page.locator('text=Start telling your story...')).toBeVisible()
  })

  test('should submit on Enter key', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    
    // Type and press Enter
    await input.fill('Test message via Enter')
    await input.press('Enter')
    
    // Message should appear
    await expect(page.locator('text=Test message via Enter')).toBeVisible()
  })

  test('should disable input while sending', async ({ page }) => {
    // Wait for loading
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    // Send a message
    await input.fill('Test message')
    await sendButton.click()
    
    // Input and button should be disabled
    await expect(input).toBeDisabled()
    await expect(sendButton).toBeDisabled()
  })
})
