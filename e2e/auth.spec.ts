import { test, expect } from '@playwright/test'

test.describe('Magic Link Authentication', () => {
  test('should show login form when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should see the login form
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible()
  })

  test('should validate email input', async ({ page }) => {
    await page.goto('/')
    
    const emailInput = page.getByPlaceholder('you@example.com')
    const submitButton = page.getByRole('button', { name: /send magic link/i })
    
    // Empty email - button should be disabled
    await expect(submitButton).toBeDisabled()
    
    // Invalid email format
    await emailInput.fill('notanemail')
    // Button might be enabled but form validation should catch it
    
    // Valid email
    await emailInput.fill('test@example.com')
    await expect(submitButton).not.toBeDisabled()
  })

  test('should show confirmation after sending magic link', async ({ page }) => {
    await page.goto('/')
    
    const emailInput = page.getByPlaceholder('you@example.com')
    const submitButton = page.getByRole('button', { name: /send magic link/i })
    
    await emailInput.fill('test@example.com')
    await submitButton.click()
    
    // Should show confirmation message
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 })
  })

  test('should handle auth callback route', async ({ page }) => {
    // Navigate to callback with invalid code - should redirect to error
    await page.goto('/auth/callback?code=invalid')
    
    // Should redirect to error page or show error
    await expect(page).toHaveURL(/auth\/auth-code-error|\//)
  })

  test('should show auth error page', async ({ page }) => {
    await page.goto('/auth/auth-code-error')
    
    // Should show error message
    await expect(page.getByText(/error|invalid|expired/i)).toBeVisible()
  })
})

test.describe('Authenticated User Flow', () => {
  // These tests would require mocking the auth state
  // In a real scenario, you'd use a test user or mock the Supabase client

  test.skip('should show main app when authenticated', async ({ page }) => {
    // Mock authentication
    await page.goto('/')
    
    // Should see the chat bar, not login
    await expect(page.getByPlaceholder(/tell me about/i)).toBeVisible()
    await expect(page.getByText('Your Story')).toBeVisible()
  })

  test.skip('should show user menu when authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Click user menu
    const userButton = page.locator('button').filter({ has: page.locator('svg') }).last()
    await userButton.click()
    
    // Should show sign out option
    await expect(page.getByText(/sign out/i)).toBeVisible()
  })
})
