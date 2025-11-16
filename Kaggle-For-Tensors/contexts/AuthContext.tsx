'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'

interface AuthContextType {
  isSignedIn: boolean
  isLoaded: boolean
  userId: string | null
  user: any
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  user: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, user } = useUser()

  const value = {
    isSignedIn: isSignedIn || false,
    isLoaded,
    userId: user?.id || null,
    user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
