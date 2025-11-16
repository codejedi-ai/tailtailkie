'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { AuthProvider } from '@/contexts/AuthContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()
  const pathname = usePathname()
  const { collapsed } = useSidebar()

  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')
  const showSidebar = isLoaded && isSignedIn && !isAuthPage

  return (
    <>
      {showSidebar && <Sidebar />}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: showSidebar ? (collapsed ? '80px' : '256px') : '0',
        }}
      >
        {children}
      </div>
    </>
  )
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </AuthProvider>
  )
}
