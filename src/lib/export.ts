import { TimelineEvent, Timeline } from './supabase'

export interface ExportData {
  timeline: {
    name: string
    exportedAt: string
    eventCount: number
  }
  events: ExportedEvent[]
}

interface ExportedEvent {
  title: string
  description?: string
  date?: string
  datePrecision?: string
  category?: string
  tags?: string[]
}

export function exportToJSON(timeline: Timeline, events: TimelineEvent[]): string {
  const exportData: ExportData = {
    timeline: {
      name: timeline.name,
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
    },
    events: events.map((event) => ({
      title: event.title,
      description: event.description || undefined,
      date: event.start_date || undefined,
      datePrecision: event.date_precision,
      category: event.category || undefined,
      tags: event.tags && event.tags.length > 0 ? event.tags : undefined,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

export function exportToCSV(events: TimelineEvent[]): string {
  const headers = ['Title', 'Description', 'Date', 'Date Precision', 'Category', 'Tags']
  
  const rows = events.map((event) => [
    escapeCSV(event.title),
    escapeCSV(event.description || ''),
    event.start_date || '',
    event.date_precision,
    event.category || '',
    event.tags ? event.tags.join('; ') : '',
  ])

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')
}

function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportAndDownloadJSON(timeline: Timeline, events: TimelineEvent[]): void {
  const json = exportToJSON(timeline, events)
  const filename = `${timeline.name.toLowerCase().replace(/\s+/g, '-')}-timeline-${new Date().toISOString().split('T')[0]}.json`
  downloadFile(json, filename, 'application/json')
}

export function exportAndDownloadCSV(timeline: Timeline, events: TimelineEvent[]): void {
  const csv = exportToCSV(events)
  const filename = `${timeline.name.toLowerCase().replace(/\s+/g, '-')}-timeline-${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename, 'text/csv')
}
