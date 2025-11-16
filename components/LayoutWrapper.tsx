'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()
  const pathname = usePathname()

  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')
  const showSidebar = isLoaded && isSignedIn && !isAuthPage

  return (
    <AuthProvider>
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? 'ml-64' : ''}>
        {children}
      </div>
    </AuthProvider>
  )
}
