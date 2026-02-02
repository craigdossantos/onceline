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

  // Fetch or create user profile and default timeline
  const initializeUserData = useCallback(async (authUser: SupabaseUser) => {
    // Get or create user profile
    let { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!userProfile) {
      // Create user profile
      const { data: newProfile } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
        })
        .select()
        .single()
      userProfile = newProfile
    }

    setProfile(userProfile)

    // Get or create default timeline for this user
    let { data: userTimeline } = await supabase
      .from('timelines')
      .select('*')
      .eq('user_id', authUser.id)
      .limit(1)
      .single()

    if (!userTimeline) {
      // Create default timeline
      const { data: newTimeline } = await supabase
        .from('timelines')
        .insert({
          user_id: authUser.id,
          name: 'My Life',
        })
        .select()
        .single()
      userTimeline = newTimeline
    }

    setTimeline(userTimeline)
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      
      if (initialSession?.user) {
        await initializeUserData(initialSession.user)
      }
      
      setIsLoading(false)
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
