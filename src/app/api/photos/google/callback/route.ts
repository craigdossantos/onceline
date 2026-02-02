import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_PHOTOS_REDIRECT_URI || 
  (process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/photos/google/callback`
    : 'http://localhost:3000/api/photos/google/callback')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    // User denied access
    return NextResponse.redirect(new URL('/?photos_error=denied', request.url))
  }
  
  if (!code) {
    return NextResponse.redirect(new URL('/?photos_error=no_code', request.url))
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange error:', errorData)
      return NextResponse.redirect(new URL('/?photos_error=token_exchange', request.url))
    }
    
    const tokens = await tokenResponse.json()
    
    // Store tokens in cookies (in production, store refresh_token in database)
    const cookieStore = await cookies()
    
    // Access token - short lived, store in cookie
    cookieStore.set('google_photos_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in, // Usually 3600 seconds
      path: '/',
    })
    
    // Refresh token - long lived (only sent on first auth or after revoke)
    if (tokens.refresh_token) {
      cookieStore.set('google_photos_refresh', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }
    
    // Redirect back to app with success
    return NextResponse.redirect(new URL('/?photos_connected=true', request.url))
    
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/?photos_error=unknown', request.url))
  }
}
