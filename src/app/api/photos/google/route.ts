import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_PHOTOS_REDIRECT_URI || 
  (process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/photos/google/callback`
    : 'http://localhost:3000/api/photos/google/callback')

const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
]

// GET /api/photos/google - Start OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'connect') {
    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    })
    
    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    )
  }
  
  if (action === 'status') {
    // Check if user has Google Photos connected
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_photos_token')?.value
    
    return NextResponse.json({
      connected: !!accessToken,
    })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// POST /api/photos/google - Search photos
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('google_photos_token')?.value
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected to Google Photos' }, { status: 401 })
  }
  
  const body = await request.json()
  const { startDate, endDate, pageToken } = body
  
  try {
    // Build date filter
    const filters: Record<string, unknown> = {}
    
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      
      if (startDate) {
        const start = new Date(startDate)
        dateFilter.startDate = {
          year: start.getFullYear(),
          month: start.getMonth() + 1,
          day: start.getDate(),
        }
      }
      
      if (endDate) {
        const end = new Date(endDate)
        dateFilter.endDate = {
          year: end.getFullYear(),
          month: end.getMonth() + 1,
          day: end.getDate(),
        }
      }
      
      filters.dateFilter = { ranges: [dateFilter] }
    }
    
    // Search Google Photos
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize: 25,
        pageToken,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      }),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to refresh
        return NextResponse.json({ error: 'Token expired', needsReconnect: true }, { status: 401 })
      }
      throw new Error(`Google Photos API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform to simpler format
    const photos = (data.mediaItems || []).map((item: {
      id: string
      baseUrl: string
      mediaMetadata?: {
        creationTime?: string
        width?: string
        height?: string
      }
      filename?: string
    }) => ({
      id: item.id,
      url: `${item.baseUrl}=w400-h400`, // Get thumbnail size
      fullUrl: `${item.baseUrl}=w2000`, // Full size for download
      dateTaken: item.mediaMetadata?.creationTime,
      width: item.mediaMetadata?.width,
      height: item.mediaMetadata?.height,
      filename: item.filename,
    }))
    
    return NextResponse.json({
      photos,
      nextPageToken: data.nextPageToken,
    })
  } catch (error) {
    console.error('Google Photos search error:', error)
    return NextResponse.json({ error: 'Failed to search photos' }, { status: 500 })
  }
}
