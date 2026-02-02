import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset onboarding state
    await page.addInitScript(() => {
      localStorage.clear()
    })
  })

  test('should show onboarding on first visit', async ({ page }) => {
    await page.goto('/')
    
    // Should see the welcome headline
    await expect(page.getByText('Every life is a story worth telling.')).toBeVisible()
    await expect(page.getByText("Let's create yours.")).toBeVisible()
  })

  test('should progress through onboarding steps', async ({ page }) => {
    await page.goto('/')
    
    // Step 1: Welcome
    await expect(page.getByText('Every life is a story worth telling.')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 2: Name
    await expect(page.getByText('What should we call you?')).toBeVisible()
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 3: Birthplace
    await expect(page.getByText('Where does your story begin?')).toBeVisible()
    await page.getByPlaceholder('City, Country').fill('San Francisco, USA')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 4: Birthdate
    await expect(page.getByText('When did your journey start?')).toBeVisible()
    await page.getByPlaceholder('Your birthdate').fill('1990-01-15')
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Step 5: Ready
    await expect(page.getByText('Your timeline awaits.')).toBeVisible()
    await page.getByRole('button', { name: 'Begin My Story' }).click()
    
    // Should now see the main app
    await expect(page.getByText('Your Story')).toBeVisible()
  })

  test('should allow going back to previous steps', async ({ page }) => {
    await page.goto('/')
    
    // Progress to name step
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('What should we call you?')).toBeVisible()
    
    // Go back
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Every life is a story worth telling.')).toBeVisible()
  })

  test('should disable continue button when field is empty', async ({ page }) => {
    await page.goto('/')
    
    // Progress to name step
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Continue button should be disabled when input is empty
    const continueButton = page.getByRole('button', { name: 'Continue' })
    await expect(continueButton).toBeDisabled()
    
    // Fill in name
    await page.getByPlaceholder('Your name').fill('Test')
    
    // Now should be enabled
    await expect(continueButton).toBeEnabled()
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/')
    
    // Should show progress dots
    const progressDots = page.locator('.flex.justify-center.gap-2 > div')
    await expect(progressDots).toHaveCount(5)
    
    // First dot should be active (wider)
    const firstDot = progressDots.first()
    await expect(firstDot).toHaveClass(/w-8/)
  })

  test('should skip onboarding if already completed', async ({ page }) => {
    // Set onboarding as completed
    await page.addInitScript(() => {
      localStorage.setItem('onceline-storage', JSON.stringify({
        state: { hasCompletedOnboarding: true },
        version: 0
      }))
    })
    
    await page.goto('/')
    
    // Should go directly to main app
    await expect(page.getByText('Every life is a story worth telling.')).not.toBeVisible()
    await expect(page.getByText('Onceline')).toBeVisible()
  })

  test('should support keyboard navigation (Enter to continue)', async ({ page }) => {
    await page.goto('/')
    
    // Progress to name step
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Fill and press Enter
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.keyboard.press('Enter')
    
    // Should progress to birthplace
    await expect(page.getByText('Where does your story begin?')).toBeVisible()
  })
})
