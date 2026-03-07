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
        'flex items-center gap-3 cursor-pointer rounded-lg p-2 -m-2 transition-all w-full group',
        'hover:bg-cyber-blue/10 hover:border-cyber-blue/30 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]',
        collapsed && 'justify-center'
      )}
      onClick={handleClick}
    >
      <div ref={userButtonRef} className="flex-shrink-0">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10 border-2 border-cyber-blue rounded-full cursor-pointer transition-all group-hover:border-cyber-blue group-hover:shadow-[0_0_10px_rgba(0,255,255,0.4)]',
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
          <p className="text-sm font-medium text-cyber-light truncate transition-colors group-hover:text-cyber-blue">
            {user?.username || user?.fullName || 'User'}
          </p>
          <p className="text-xs text-cyber-light/50 truncate transition-colors group-hover:text-cyber-light/80">
            {user?.primaryEmailAddress?.emailAddress || ''}
          </p>
        </div>
      )}
    </div>
  )
}

