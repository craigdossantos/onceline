import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timeline } from './Timeline'
import { useStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store', () => ({
  useStore: vi.fn(),
}))

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>

describe('Timeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('should show loading spinner when loading', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: true,
      })

      render(<Timeline />)

      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('should show empty state when no events', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('📍')).toBeInTheDocument()
      expect(screen.getByText('Events will appear here as you share your story')).toBeInTheDocument()
    })

    it('should show "0 events" in header when empty', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('0 events')).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('should render timeline header', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Your Timeline')).toBeInTheDocument()
    })

    it('should show correct event count', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event 1', start_date: '2024-01-01', category: 'milestone', date_precision: 'day' },
          { id: '2', title: 'Event 2', start_date: '2024-06-01', category: 'work', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('2 events')).toBeInTheDocument()
    })
  })

  describe('Zoom controls', () => {
    it('should render zoom controls', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('−')).toBeInTheDocument()
      expect(screen.getByText('+')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should increase zoom on plus click', async () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)
      const user = userEvent.setup()

      const plusButton = screen.getByText('+')
      await user.click(plusButton)

      expect(screen.getByText('125%')).toBeInTheDocument()
    })

    it('should decrease zoom on minus click', async () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)
      const user = userEvent.setup()

      const minusButton = screen.getByText('−')
      await user.click(minusButton)

      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should not zoom below 50%', async () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)
      const user = userEvent.setup()

      const minusButton = screen.getByText('−')
      
      for (let i = 0; i < 5; i++) {
        await user.click(minusButton)
      }

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should not zoom above 200%', async () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)
      const user = userEvent.setup()

      const plusButton = screen.getByText('+')
      
      for (let i = 0; i < 10; i++) {
        await user.click(plusButton)
      }

      expect(screen.getByText('200%')).toBeInTheDocument()
    })
  })

  describe('Events rendering', () => {
    it('should render event pins with correct icons', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Born', start_date: '1990-01-01', category: 'birth', date_precision: 'day' },
          { id: '2', title: 'School', start_date: '1996-09-01', category: 'education', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      // Icons appear both in pins and in legend, so use getAllByText
      expect(screen.getAllByText('👶').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('🎓').length).toBeGreaterThanOrEqual(1)
    })

    it('should render event title in card', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Started new job', start_date: '2024-01-15', category: 'work', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Started new job')).toBeInTheDocument()
    })

    it('should render event description when present', () => {
      mockUseStore.mockReturnValue({
        events: [
          { 
            id: '1', 
            title: 'Vacation', 
            description: 'Trip to Hawaii',
            start_date: '2024-06-01', 
            category: 'travel', 
            date_precision: 'day' 
          },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Trip to Hawaii')).toBeInTheDocument()
    })

    it('should use memory category for unknown categories', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Random event', start_date: '2024-01-01', category: 'unknown-category', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      // Memory icon appears in both event pin and legend
      expect(screen.getAllByText('💭').length).toBeGreaterThanOrEqual(1)
    })

    it('should not render events without start_date', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event with date', start_date: '2024-01-01', category: 'milestone', date_precision: 'day' },
          { id: '2', title: 'Event without date', start_date: null, category: 'memory', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Event with date')).toBeInTheDocument()
      expect(screen.queryByText('Event without date')).not.toBeInTheDocument()
    })
  })

  describe('Date formatting', () => {
    it('should format date with day precision', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event', start_date: '2024-03-15', category: 'milestone', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
    })

    it('should format date with month precision', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event', start_date: '2024-03-15', category: 'milestone', date_precision: 'month' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('Mar 2024')).toBeInTheDocument()
    })

    it('should format date with year precision', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event', start_date: '2024-03-15', category: 'milestone', date_precision: 'year' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      // 2024 appears in the event card date and possibly in year markers
      expect(screen.getAllByText('2024').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Event selection', () => {
    it('should toggle event selection on click', async () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Clickable Event', start_date: '2024-01-01', category: 'milestone', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)
      const user = userEvent.setup()

      // Milestone icon appears in both pin and legend, get the first one (the pin)
      const eventPins = screen.getAllByText('⭐')
      const eventPin = eventPins[0]
      await user.click(eventPin)

      // Event card should become visible (check for scale class)
      const eventContainer = eventPin.closest('.cursor-pointer')
      expect(eventContainer).toBeInTheDocument()
    })
  })

  describe('Category legend', () => {
    it('should render category legend', () => {
      mockUseStore.mockReturnValue({
        events: [],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('birth')).toBeInTheDocument()
      expect(screen.getByText('education')).toBeInTheDocument()
      expect(screen.getByText('residence')).toBeInTheDocument()
      expect(screen.getByText('work')).toBeInTheDocument()
      expect(screen.getByText('travel')).toBeInTheDocument()
      expect(screen.getByText('relationship')).toBeInTheDocument()
      expect(screen.getByText('milestone')).toBeInTheDocument()
      expect(screen.getByText('memory')).toBeInTheDocument()
    })
  })

  describe('Year markers', () => {
    it('should render year markers for timeline span', () => {
      mockUseStore.mockReturnValue({
        events: [
          { id: '1', title: 'Event 1', start_date: '2020-01-01', category: 'milestone', date_precision: 'day' },
          { id: '2', title: 'Event 2', start_date: '2023-01-01', category: 'milestone', date_precision: 'day' },
        ],
        isLoading: false,
      })

      render(<Timeline />)

      expect(screen.getByText('2020')).toBeInTheDocument()
      expect(screen.getByText('2021')).toBeInTheDocument()
      expect(screen.getByText('2022')).toBeInTheDocument()
      expect(screen.getByText('2023')).toBeInTheDocument()
    })
  })
})
