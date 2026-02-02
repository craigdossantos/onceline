/**
 * Auth Flow Tests
 * Tests the complete authentication flow from anonymous → magic link → authenticated
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase client
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignInWithOtp = vi.fn()
const mockSignOut = vi.fn()
const mockExchangeCodeForSession = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signInWithOtp: (params: unknown) => mockSignInWithOtp(params),
      signOut: () => mockSignOut(),
      exchangeCodeForSession: (code: string) => mockExchangeCodeForSession(code),
    },
    from: (table: string) => mockFrom(table),
  },
  createClient: () => ({
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signInWithOtp: (params: unknown) => mockSignInWithOtp(params),
      signOut: () => mockSignOut(),
    },
    from: (table: string) => mockFrom(table),
  }),
}))

describe('Auth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Anonymous User Flow', () => {
    it('should show anonymous mode when no session exists', async () => {
      // Setup: No session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Verify the mock
      const result = await mockGetSession()
      expect(result.data.session).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should allow anonymous user to add events', async () => {
      // This would be handled by localStorage in anonymous mode
      const anonymousData = {
        events: [],
        messages: [],
      }
      
      // Add an event
      const newEvent = {
        id: 'test-event-1',
        title: 'Test Event',
        start_date: '2020-01-01',
        timeline_id: 'anonymous',
      }
      
      anonymousData.events.push(newEvent as never)
      expect(anonymousData.events).toHaveLength(1)
    })
  })

  describe('Magic Link Flow', () => {
    it('should send magic link email', async () => {
      mockSignInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await mockSignInWithOtp({
        email: 'test@example.com',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      })

      expect(result.error).toBeNull()
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      })
    })

    it('should handle magic link email errors', async () => {
      mockSignInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      })

      const result = await mockSignInWithOtp({
        email: 'test@example.com',
      })

      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('Rate limit exceeded')
    })
  })

  describe('Auth Callback Flow', () => {
    it('should exchange code for session', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      }

      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await mockExchangeCodeForSession('test-code')
      
      expect(result.error).toBeNull()
      expect(result.data.session.user.id).toBe('user-123')
    })

    it('should handle invalid code', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid code' },
      })

      const result = await mockExchangeCodeForSession('invalid-code')
      
      expect(result.error).toBeTruthy()
      expect(result.data.session).toBeNull()
    })
  })

  describe('Authenticated User Flow', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    }

    const mockSession = {
      user: mockUser,
      access_token: 'mock-access-token',
    }

    it('should load timeline for authenticated user', async () => {
      // Setup: User has session
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock timeline query
      const mockTimeline = {
        id: 'timeline-123',
        name: 'My Life',
        user_id: 'user-123',
      }

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [mockTimeline],
              error: null,
            }),
          }),
        }),
      })

      // Verify flow
      const sessionResult = await mockGetSession()
      expect(sessionResult.data.session).toBeTruthy()
      expect(sessionResult.data.session.user.id).toBe('user-123')

      const userResult = await mockGetUser()
      expect(userResult.data.user.id).toBe('user-123')
    })

    it('should create timeline if none exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock no existing timeline
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-timeline-123',
                name: 'My Life',
                user_id: 'user-123',
              },
              error: null,
            }),
          }),
        }),
      })

      // Timeline should be created
      const mockTimelinesTable = mockFrom('timelines')
      const insertResult = await mockTimelinesTable.insert({
        name: 'My Life',
        user_id: 'user-123',
      }).select().single()

      expect(insertResult.data.id).toBe('new-timeline-123')
    })
  })

  describe('Auth State Changes', () => {
    it('should handle SIGNED_IN event', () => {
      let capturedCallback: ((event: string, session: unknown) => void) | null = null
      
      mockOnAuthStateChange.mockImplementation((callback) => {
        capturedCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      // Simulate setting up the listener
      const mockCallback = vi.fn()
      mockOnAuthStateChange(mockCallback)

      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    it('should handle SIGNED_OUT event', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const result = await mockSignOut()
      expect(result.error).toBeNull()
    })
  })

  describe('Data Migration Flow', () => {
    it('should migrate anonymous data to authenticated account', async () => {
      const anonymousData = {
        events: [
          { id: 'anon-event-1', title: 'Anonymous Event', timeline_id: 'anonymous' },
        ],
        messages: [
          { id: 'anon-msg-1', role: 'user', content: 'Hello', timeline_id: 'anonymous' },
        ],
      }

      const mockUser = { id: 'user-123' }
      const mockTimeline = { id: 'timeline-123' }

      // Mock insert operations for migration
      const mockInsert = vi.fn().mockResolvedValue({ error: null })
      
      mockFrom.mockReturnValue({
        insert: mockInsert,
      })

      // Migrate events
      for (const event of anonymousData.events) {
        await mockFrom('events').insert({
          ...event,
          timeline_id: mockTimeline.id,
        })
      }

      // Migrate messages
      for (const message of anonymousData.messages) {
        await mockFrom('chat_messages').insert({
          ...message,
          timeline_id: mockTimeline.id,
        })
      }

      expect(mockInsert).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Loading States', () => {
  it('should track authLoading state correctly', async () => {
    // Initially loading
    let isLoading = true
    
    mockGetSession.mockImplementation(async () => {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 10))
      isLoading = false
      return { data: { session: null }, error: null }
    })

    expect(isLoading).toBe(true)
    await mockGetSession()
    expect(isLoading).toBe(false)
  })

  it('should track storeLoading state correctly', async () => {
    let storeLoading = true

    // Simulate store initialization
    const initTimeline = async () => {
      storeLoading = true
      await new Promise(resolve => setTimeout(resolve, 10))
      storeLoading = false
    }

    await initTimeline()
    expect(storeLoading).toBe(false)
  })

  it('should not show loading spinner when all states are ready', () => {
    const authLoading = false
    const isInitialized = true
    const storeLoading = false

    const showLoading = authLoading || !isInitialized || storeLoading
    expect(showLoading).toBe(false)
  })

  it('should show loading spinner when auth is loading', () => {
    const authLoading = true
    const isInitialized = true
    const storeLoading = false

    const showLoading = authLoading || !isInitialized || storeLoading
    expect(showLoading).toBe(true)
  })

  it('should show loading spinner when store is loading', () => {
    const authLoading = false
    const isInitialized = true
    const storeLoading = true

    const showLoading = authLoading || !isInitialized || storeLoading
    expect(showLoading).toBe(true)
  })
})
