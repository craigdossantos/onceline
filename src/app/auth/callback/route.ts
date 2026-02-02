import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[auth/callback] Starting, code:', code ? 'present' : 'missing')

  if (code) {
    const cookieStore = await cookies()
    
    // Store cookies to set on the response
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const all = cookieStore.getAll()
            console.log('[auth/callback] getAll cookies:', all.length)
            return all
          },
          setAll(cookies) {
            console.log('[auth/callback] setAll called with', cookies.length, 'cookies')
            // Store cookies to set on response later
            cookiesToSet.push(...cookies)
          },
        },
      }
    )

    console.log('[auth/callback] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] Exchange result:', { hasSession: !!data?.session, error })
    
    if (!error && data?.session) {
      // Create redirect response
      const response = NextResponse.redirect(`${origin}${next}`)
      
      // Set all the auth cookies on the response
      console.log('[auth/callback] Setting', cookiesToSet.length, 'cookies on response')
      for (const { name, value, options } of cookiesToSet) {
        console.log('[auth/callback] Setting cookie:', name)
        response.cookies.set(name, value, options)
      }
      
      console.log('[auth/callback] Redirecting to:', `${origin}${next}`)
      return response
    }
    
    if (error) {
      console.error('[auth/callback] Exchange error:', error)
    }
  }

  // Return the user to an error page with instructions
  console.log('[auth/callback] Redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
