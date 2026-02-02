'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { createClient, User, Timeline } from '@/lib/supabase'

interface AuthContextType {
  user: SupabaseUser | null
  profile: User | null
  timeline: Timeline | null
  session: Session | null
  isLoading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Set up user profile from auth data (no DB calls - store handles timeline)
  const initializeUserData = useCallback(async (authUser: SupabaseUser) => {
    console.log('[AuthContext.initializeUserData] setting profile for user:', authUser.id)
    // Just create a profile object from auth data - store handles timeline creation
    setProfile({
      id: authUser.id,
      email: authUser.email || '',
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User)
    // Don't set timeline here - let store.initTimeline handle it
    console.log('[AuthContext.initializeUserData] profile set, timeline will be loaded by store')
  }, [])

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      console.log('[AuthContext] initAuth starting')
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        console.log('[AuthContext] getSession result:', { hasSession: !!initialSession, error })
        
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        if (initialSession?.user) {
          console.log('[AuthContext] calling initializeUserData')
          await initializeUserData(initialSession.user)
          console.log('[AuthContext] initializeUserData completed')
        }
      } catch (error) {
        console.error('[AuthContext] initAuth error:', error)
      } finally {
        console.log('[AuthContext] setting isLoading=false')
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (event === 'SIGNED_IN' && newSession?.user) {
          await initializeUserData(newSession.user)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setTimeline(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initializeUserData])

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTimeline(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        timeline,
        session,
        isLoading,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
