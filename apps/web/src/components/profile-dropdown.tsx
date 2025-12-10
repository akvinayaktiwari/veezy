'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { signOut } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

export function ProfileDropdown() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          setUser(null)
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    try {
      toast.loading('Signing out...')
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const handleAccountSettings = () => {
    toast.info('Account settings coming soon!')
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <Skeleton className="h-10 w-10 rounded-full md:h-10 md:w-10" />
  }

  if (loading) {
    return <Skeleton className="h-9 w-9 rounded-full md:h-10 md:w-10" />
  }

  // Get user data
  const avatarUrl = user?.user_metadata?.avatar_url
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name
  const email = user?.email || ''
  
  // Generate initials from name or email
  const getInitials = () => {
    if (fullName) {
      const names = fullName.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return fullName[0].toUpperCase()
    }
    return email[0]?.toUpperCase() || 'U'
  }

  const initials = getInitials()

  // Generate consistent color from email
  const getAvatarColor = () => {
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-teal-600',
      'bg-orange-600',
    ]
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative h-9 w-9 md:h-10 md:w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-opacity hover:opacity-90"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            {avatarUrl && (
              <AvatarImage 
                src={avatarUrl} 
                alt={fullName || email}
              />
            )}
            <AvatarFallback className={`${getAvatarColor()} text-white font-medium`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 md:w-70"
        sideOffset={8}
      >
        {/* User Info Section */}
        <div className="flex items-start gap-3 px-2 py-3">
          <Avatar className="h-12 w-12">
            {avatarUrl && (
              <AvatarImage 
                src={avatarUrl} 
                alt={fullName || email}
              />
            )}
            <AvatarFallback className={`${getAvatarColor()} text-white font-medium text-lg`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {fullName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {email}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem 
          onClick={handleAccountSettings}
          className="cursor-pointer"
        >
          <Cog6ToothIcon className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
