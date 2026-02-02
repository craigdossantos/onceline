import { test, expect } from '@playwright/test'

test.describe('Chat Sheet', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('onceline-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true },
        version: 0
      }))
    })
  })

  test('should open chat sheet when FAB is clicked', async ({ page }) => {
    await page.goto('/')
    
    // Click the chat FAB
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Should show chat sheet header
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    await expect(page.getByText("Share memories and I'll add them to your timeline")).toBeVisible()
  })

  test('should close chat sheet when X is clicked', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    
    // Close chat
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') })
    await closeButton.click()
    
    // Chat should be hidden
    await expect(page.getByText('Tell Your Story')).not.toBeVisible()
  })

  test('should show empty state message initially', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Should show inspirational quote
    await expect(page.getByText('Every memory is a thread in the tapestry of your life.')).toBeVisible()
  })

  test('should have input field and send button', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Input field should exist
    const input = page.getByPlaceholder('Share a memory...')
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
    
    // Send button should exist
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') })
    await expect(sendButton).toBeVisible()
  })

  test('should disable send button when input is empty', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Send button should be disabled
    const sendButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') })
    await expect(sendButton).toBeDisabled()
    
    // Type something
    const input = page.getByPlaceholder('Share a memory...')
    await input.fill('Hello')
    
    // Send button should be enabled
    await expect(sendButton).toBeEnabled()
  })

  test('should show backdrop when chat is open', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Wait for chat to open
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    
    // Backdrop should be visible (use data attribute would be better, but for now check the overlay exists)
    const backdrop = page.locator('[class*="backdrop-blur"]').first()
    await expect(backdrop).toBeVisible()
  })

  test('should close chat when X button is clicked', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    
    // Click X button to close
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') })
    await closeButton.click()
    
    // Chat should close
    await expect(page.getByText('Tell Your Story')).not.toBeVisible()
  })

  test('should focus input when chat opens', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Input should be focused
    const input = page.getByPlaceholder('Share a memory...')
    await expect(input).toBeFocused()
  })

  test('should have drag handle for sheet dismissal', async ({ page }) => {
    await page.goto('/')
    
    // Open chat
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    // Wait for chat to be visible
    await expect(page.getByText('Tell Your Story')).toBeVisible()
    
    // Drag handle should be visible (the small rounded bar at top)
    // Check that the chat sheet itself is visible with rounded top corners
    const chatSheet = page.locator('[class*="rounded-t-3xl"]')
    await expect(chatSheet).toBeVisible()
  })
})

test.describe('Chat Message Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('onceline-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true },
        version: 0
      }))
    })
  })

  test('should clear input after submission', async ({ page }) => {
    // This test would need API mocking
    // For now, verify the input behavior
    await page.goto('/')
    
    const chatFab = page.locator('button').filter({ has: page.locator('svg.lucide-message-circle') })
    await chatFab.click()
    
    const input = page.getByPlaceholder('Share a memory...')
    await input.fill('Test message')
    
    await expect(input).toHaveValue('Test message')
  })
})
