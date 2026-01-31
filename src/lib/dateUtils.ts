import { format, parseISO, isValid, differenceInYears } from 'date-fns'

export type DatePrecision = 'year' | 'month' | 'day'

/**
 * Format a date string based on the given precision
 */
export function formatEventDate(
  dateString: string | null | undefined,
  precision: DatePrecision = 'day'
): string {
  if (!dateString) return 'Date unknown'
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return 'Invalid date'
    
    switch (precision) {
      case 'year':
        return format(date, 'yyyy')
      case 'month':
        return format(date, 'MMM yyyy')
      case 'day':
      default:
        return format(date, 'MMM d, yyyy')
    }
  } catch {
    return 'Invalid date'
  }
}

/**
 * Calculate age at a given date from birth date
 */
export function calculateAge(
  birthDate: string | Date,
  atDate: string | Date = new Date()
): number | null {
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate
    const at = typeof atDate === 'string' ? parseISO(atDate) : atDate
    
    if (!isValid(birth) || !isValid(at)) return null
    
    return differenceInYears(at, birth)
  } catch {
    return null
  }
}

/**
 * Get the year from a date string
 */
export function getYear(dateString: string | null | undefined): number | null {
  if (!dateString) return null
  
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return null
    return date.getFullYear()
  } catch {
    return null
  }
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString) return false
  
  try {
    const date = parseISO(dateString)
    return isValid(date)
  } catch {
    return false
  }
}

/**
 * Sort events by start_date (ascending)
 */
export function sortEventsByDate<T extends { start_date?: string | null }>(
  events: T[],
  ascending = true
): T[] {
  return [...events].sort((a, b) => {
    if (!a.start_date && !b.start_date) return 0
    if (!a.start_date) return ascending ? 1 : -1
    if (!b.start_date) return ascending ? -1 : 1
    
    const dateA = new Date(a.start_date).getTime()
    const dateB = new Date(b.start_date).getTime()
    
    return ascending ? dateA - dateB : dateB - dateA
  })
}
