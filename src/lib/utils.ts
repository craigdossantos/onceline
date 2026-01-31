import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateDisplay(
  date: string | null | undefined,
  precision: 'year' | 'month' | 'day' = 'day'
): string {
  if (!date) return 'Date unknown'
  
  const d = new Date(date)
  
  switch (precision) {
    case 'year':
      return d.getFullYear().toString()
    case 'month':
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'day':
    default:
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
}

export function getRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffYears = Math.floor(diffDays / 365)
  
  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  } else if (diffDays > 30) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    return 'Today'
  }
}

export function calculateAge(birthDate: string, targetDate?: string): number {
  const birth = new Date(birthDate)
  const target = targetDate ? new Date(targetDate) : new Date()
  
  let age = target.getFullYear() - birth.getFullYear()
  const monthDiff = target.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}
