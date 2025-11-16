'use client'

import { useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

interface UserSectionProps {
  collapsed?: boolean
}

export function UserSection({ collapsed = false }: UserSectionProps) {
  const { user } = useUser()
  const userButtonRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    // Find and click the UserButton's trigger button
    const userButtonContainer = userButtonRef.current
    if (userButtonContainer) {
      const triggerButton = userButtonContainer.querySelector('button')
      if (triggerButton) {
        triggerButton.click()
      }
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 cursor-pointer hover:bg-cyber-blue/5 rounded-lg p-2 -m-2 transition-colors w-full',
        collapsed && 'justify-center'
      )}
      onClick={handleClick}
    >
      <div ref={userButtonRef} className="flex-shrink-0">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10 border-2 border-cyber-blue rounded-full cursor-pointer',
              userButtonPopoverCard: 'bg-black/95 border border-cyber-blue/30',
              userButtonPopoverActions: 'bg-black/50',
              userButtonPopoverActionButton: 'text-cyber-light hover:bg-cyber-blue/10 hover:text-cyber-blue',
              userButtonPopoverActionButtonText: 'text-cyber-light',
              userButtonPopoverFooter: 'hidden',
            },
          }}
        />
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-cyber-light truncate hover:text-cyber-blue transition-colors">
            {user?.username || user?.fullName || 'User'}
          </p>
          <p className="text-xs text-cyber-light/50 truncate hover:text-cyber-light/70 transition-colors">
            {user?.primaryEmailAddress?.emailAddress || ''}
          </p>
        </div>
      )}
    </div>
  )
}

