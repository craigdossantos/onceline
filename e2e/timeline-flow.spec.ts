import { test, expect } from '@playwright/test'

test.describe('Onceline Timeline Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('h1:has-text("Onceline")')
  })

  test('should display the main layout', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Onceline')
    await expect(page.locator('text=Your life, one line at a time')).toBeVisible()
    await expect(page.locator('text=Build Your Timeline')).toBeVisible()
    await expect(page.locator('text=Your Timeline')).toBeVisible()
  })

  test('should show empty state for new timeline', async ({ page }) => {
    await page.waitForSelector('text=0 events', { timeout: 10000 })
    await expect(page.locator('text=Start telling your story...')).toBeVisible()
    await expect(page.locator('text=Events will appear here')).toBeVisible()
  })

  test('should have functional chat input', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
    
    await input.fill('I was born on January 1, 1990')
    await expect(input).toHaveValue('I was born on January 1, 1990')
    
    const sendButton = page.locator('button:has-text("Send")')
    await expect(sendButton).toBeEnabled()
  })

  test('should send a message and show it in chat', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    await input.fill('Hello, this is a test message')
    await sendButton.click()
    
    await expect(page.locator('text=Hello, this is a test message')).toBeVisible()
    await expect(input).toHaveValue('')
    
    const loadingDots = page.locator('.animate-bounce')
    await expect(loadingDots.first()).toBeVisible()
  })

  test('should have working zoom controls on timeline', async ({ page }) => {
    await page.waitForSelector('text=Your Timeline', { timeout: 10000 })
    
    const zoomIn = page.locator('button:has-text("+")')
    const zoomOut = page.locator('button:has-text("−")')
    const zoomLevel = page.locator('text=100%')
    
    await expect(zoomLevel).toBeVisible()
    
    await zoomIn.click()
    await expect(page.locator('text=125%')).toBeVisible()
    
    await zoomOut.click()
    await expect(page.locator('text=100%')).toBeVisible()
    await zoomOut.click()
    await expect(page.locator('text=75%')).toBeVisible()
  })

  test('should show category legend', async ({ page }) => {
    await page.waitForSelector('text=Your Timeline', { timeout: 10000 })
    
    const categories = ['birth', 'education', 'residence', 'work', 'travel', 'relationship', 'milestone', 'memory']
    
    for (const category of categories) {
      await expect(page.locator(`text=${category}`).first()).toBeVisible()
    }
  })

  test('should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('h1')).toContainText('Onceline')
    await expect(page.locator('input[placeholder*="Share a memory"]')).toBeVisible()
  })

  test('should prevent sending empty messages', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    await input.fill('')
    await sendButton.click()
    
    await expect(page.locator('text=Start telling your story...')).toBeVisible()
  })

  test('should submit on Enter key', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    
    await input.fill('Test message via Enter')
    await input.press('Enter')
    
    await expect(page.locator('text=Test message via Enter')).toBeVisible()
  })

  test('should disable input while sending', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="Share a memory"]', { timeout: 10000 })
    
    const input = page.locator('input[placeholder*="Share a memory"]')
    const sendButton = page.locator('button:has-text("Send")')
    
    await input.fill('Test message')
    await sendButton.click()
    
    await expect(input).toBeDisabled()
    await expect(sendButton).toBeDisabled()
  })
})
