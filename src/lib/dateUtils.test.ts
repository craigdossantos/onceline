import { describe, it, expect } from 'vitest'
import {
  formatEventDate,
  calculateAge,
  getYear,
  isValidDateString,
  sortEventsByDate,
} from './dateUtils'

describe('formatEventDate', () => {
  it('should format date with day precision', () => {
    expect(formatEventDate('2024-01-15', 'day')).toBe('Jan 15, 2024')
  })

  it('should format date with month precision', () => {
    expect(formatEventDate('2024-01-15', 'month')).toBe('Jan 2024')
  })

  it('should format date with year precision', () => {
    expect(formatEventDate('2024-01-15', 'year')).toBe('2024')
  })

  it('should default to day precision', () => {
    expect(formatEventDate('2024-06-20')).toBe('Jun 20, 2024')
  })

  it('should handle null date', () => {
    expect(formatEventDate(null)).toBe('Date unknown')
  })

  it('should handle undefined date', () => {
    expect(formatEventDate(undefined)).toBe('Date unknown')
  })

  it('should handle invalid date string', () => {
    expect(formatEventDate('not-a-date')).toBe('Invalid date')
  })

  it('should handle empty string', () => {
    expect(formatEventDate('')).toBe('Date unknown')
  })
})

describe('calculateAge', () => {
  it('should calculate age correctly', () => {
    expect(calculateAge('1990-01-01', '2024-01-01')).toBe(34)
  })

  it('should handle birthday not yet reached in current year', () => {
    expect(calculateAge('1990-12-31', '2024-01-01')).toBe(33)
  })

  it('should handle Date objects', () => {
    expect(calculateAge(new Date('1990-01-01'), new Date('2024-01-01'))).toBe(34)
  })

  it('should default to current date', () => {
    const age = calculateAge('2000-01-01')
    expect(age).toBeGreaterThanOrEqual(24)
  })

  it('should return null for invalid birth date', () => {
    expect(calculateAge('invalid-date')).toBeNull()
  })

  it('should return null for invalid at date', () => {
    expect(calculateAge('1990-01-01', 'invalid-date')).toBeNull()
  })
})

describe('getYear', () => {
  it('should extract year from date string', () => {
    expect(getYear('2024-06-15')).toBe(2024)
  })

  it('should handle null', () => {
    expect(getYear(null)).toBeNull()
  })

  it('should handle undefined', () => {
    expect(getYear(undefined)).toBeNull()
  })

  it('should handle invalid date', () => {
    expect(getYear('not-a-date')).toBeNull()
  })

  it('should handle various years', () => {
    expect(getYear('1985-01-01')).toBe(1985)
    expect(getYear('2000-12-31')).toBe(2000)
    expect(getYear('2030-06-15')).toBe(2030)
  })
})

describe('isValidDateString', () => {
  it('should return true for valid date strings', () => {
    expect(isValidDateString('2024-01-01')).toBe(true)
    expect(isValidDateString('1990-12-31')).toBe(true)
    expect(isValidDateString('2024-06-15T10:30:00')).toBe(true)
  })

  it('should return false for null', () => {
    expect(isValidDateString(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isValidDateString(undefined)).toBe(false)
  })

  it('should return false for invalid strings', () => {
    expect(isValidDateString('not-a-date')).toBe(false)
    expect(isValidDateString('2024-13-01')).toBe(false)
    expect(isValidDateString('')).toBe(false)
  })
})

describe('sortEventsByDate', () => {
  const events = [
    { id: '1', title: 'Event 1', start_date: '2024-01-15' },
    { id: '2', title: 'Event 2', start_date: '2020-06-01' },
    { id: '3', title: 'Event 3', start_date: null },
    { id: '4', title: 'Event 4', start_date: '2022-03-20' },
  ]

  it('should sort events ascending by default', () => {
    const sorted = sortEventsByDate(events)
    
    expect(sorted[0].start_date).toBe('2020-06-01')
    expect(sorted[1].start_date).toBe('2022-03-20')
    expect(sorted[2].start_date).toBe('2024-01-15')
    expect(sorted[3].start_date).toBeNull()
  })

  it('should sort events descending when specified', () => {
    const sorted = sortEventsByDate(events, false)
    
    expect(sorted[0].start_date).toBeNull()
    expect(sorted[1].start_date).toBe('2024-01-15')
    expect(sorted[2].start_date).toBe('2022-03-20')
    expect(sorted[3].start_date).toBe('2020-06-01')
  })

  it('should not mutate original array', () => {
    const original = [...events]
    sortEventsByDate(events)
    
    expect(events).toEqual(original)
  })

  it('should handle empty array', () => {
    expect(sortEventsByDate([])).toEqual([])
  })

  it('should handle array with all null dates', () => {
    const nullEvents = [
      { id: '1', start_date: null },
      { id: '2', start_date: null },
    ]
    const sorted = sortEventsByDate(nullEvents)
    
    expect(sorted).toHaveLength(2)
  })

  it('should handle array with undefined dates', () => {
    const undefinedEvents = [
      { id: '1', start_date: undefined },
      { id: '2', start_date: '2024-01-01' },
    ]
    const sorted = sortEventsByDate(undefinedEvents)
    
    expect(sorted[0].start_date).toBe('2024-01-01')
  })
})
