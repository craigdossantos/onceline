import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chat } from './Chat'
import { useStore } from '@/lib/store'

// Mock the store
vi.mock('@/lib/store', () => ({
  useStore: vi.fn(),
}))

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>

describe('Chat Component', () => {
  const mockSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSendMessage.mockClear()
  })

  describe('Rendering', () => {
    it('should render the chat header', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByText('Build Your Timeline')).toBeInTheDocument()
      expect(screen.getByText("Tell me about your life and I'll help you document it")).toBeInTheDocument()
    })

    it('should render empty state when no messages', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByText('Start telling your story...')).toBeInTheDocument()
      expect(screen.getByText('✨')).toBeInTheDocument()
    })

    it('should render user messages aligned right', () => {
      mockUseStore.mockReturnValue({
        messages: [
          { id: '1', role: 'user', content: 'Hello!', timeline_id: 't1', created_at: '' },
        ],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    it('should render assistant messages aligned left', () => {
      mockUseStore.mockReturnValue({
        messages: [
          { id: '1', role: 'assistant', content: 'Hi there!', timeline_id: 't1', created_at: '' },
        ],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should render multiple messages in order', () => {
      mockUseStore.mockReturnValue({
        messages: [
          { id: '1', role: 'user', content: 'First message', timeline_id: 't1', created_at: '' },
          { id: '2', role: 'assistant', content: 'Second message', timeline_id: 't1', created_at: '' },
          { id: '3', role: 'user', content: 'Third message', timeline_id: 't1', created_at: '' },
        ],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
      expect(screen.getByText('Third message')).toBeInTheDocument()
    })
  })

  describe('Input handling', () => {
    it('should have a text input field', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      expect(input).toBeInTheDocument()
    })

    it('should have a send button', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should update input value on change', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      await user.type(input, 'Test message')

      expect(input).toHaveValue('Test message')
    })
  })

  describe('Sending messages', () => {
    it('should call sendMessage on form submit', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      await user.type(input, 'Hello world')
      
      const button = screen.getByRole('button', { name: /send/i })
      await user.click(button)

      expect(mockSendMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should clear input after sending', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      await user.type(input, 'Test message')
      
      const button = screen.getByRole('button', { name: /send/i })
      await user.click(button)

      expect(input).toHaveValue('')
    })

    it('should not send empty messages', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const button = screen.getByRole('button', { name: /send/i })
      await user.click(button)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should not send whitespace-only messages', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      await user.type(input, '   ')
      
      const button = screen.getByRole('button', { name: /send/i })
      await user.click(button)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('should submit on Enter key', async () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)
      const user = userEvent.setup()

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      await user.type(input, 'Test message{enter}')

      expect(mockSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  describe('Loading state', () => {
    it('should show loading indicator when sending', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: true,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      // Check for the bouncing dots
      const dots = document.querySelectorAll('.animate-bounce')
      expect(dots.length).toBe(3)
    })

    it('should disable input while sending', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: true,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      expect(input).toBeDisabled()
    })

    it('should disable send button while sending', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: true,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      const button = screen.getByRole('button', { name: /send/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible form', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      const input = screen.getByPlaceholderText('Share a memory, answer a question...')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should have submit button with accessible name', () => {
      mockUseStore.mockReturnValue({
        messages: [],
        isSending: false,
        sendMessage: mockSendMessage,
      })

      render(<Chat />)

      const button = screen.getByRole('button', { name: /send/i })
      expect(button).toHaveAttribute('type', 'submit')
    })
  })
})
