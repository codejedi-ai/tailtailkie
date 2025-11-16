'use client'

import { useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser()
  const { user } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    } else if (isSignedIn && user) {
      // Redirect to Clerk's user profile management page
      user.redirectToUserProfile()
    }
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue mx-auto mb-4" />
        <p className="text-cyber-light/70">Redirecting to account settings...</p>
      </div>
    </div>
  )
}
