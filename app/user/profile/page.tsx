'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Database, Download, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserStats {
  totalDatasets: number
  totalDownloads: number
  totalViews: number
  totalSize: number
}

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    } else if (isSignedIn) {
      fetchUserStats()
    }
  }, [isLoaded, isSignedIn, router])

  async function fetchUserStats() {
    try {
      const response = await fetch(`/api/datasets?userId=${user?.id}`)
      const data = await response.json()

      const totalDatasets = data.total || 0
      const totalDownloads = data.datasets?.reduce((acc: number, d: any) => acc + d.downloadCount, 0) || 0
      const totalViews = data.datasets?.reduce((acc: number, d: any) => acc + d.viewCount, 0) || 0
      const totalSize = data.datasets?.reduce((acc: number, d: any) => acc + d.totalSize, 0) || 0

      setStats({
        totalDatasets,
        totalDownloads,
        totalViews,
        totalSize,
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark via-black to-cyber-dark py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple bg-clip-text text-transparent">
          My Profile
        </h1>

        {/* Profile Card */}
        <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <img
                src={user?.imageUrl}
                alt={user?.fullName || 'User'}
                className="w-24 h-24 rounded-full border-4 border-cyber-blue shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyber-green rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-cyber-light mb-2">
                {user?.fullName || user?.username || 'Anonymous User'}
              </h2>

              <div className="space-y-2 text-cyber-light/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyber-blue" />
                  <span>{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyber-pink" />
                  <span>@{user?.username || user?.id?.substring(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyber-purple" />
                  <span>Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.open(user?.primaryEmailAddress?.emailAddress ? `mailto:${user.primaryEmailAddress.emailAddress}` : '#')}
              variant="outline"
              className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-cyber-blue" />
              <span className="text-xs text-cyber-light/50">Total</span>
            </div>
            <div className="text-3xl font-bold text-cyber-blue">{stats?.totalDatasets || 0}</div>
            <div className="text-sm text-cyber-light/70">Datasets</div>
          </div>

          <div className="bg-black/50 border border-cyber-pink/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Download className="w-8 h-8 text-cyber-pink" />
              <span className="text-xs text-cyber-light/50">Total</span>
            </div>
            <div className="text-3xl font-bold text-cyber-pink">{stats?.totalDownloads || 0}</div>
            <div className="text-sm text-cyber-light/70">Downloads</div>
          </div>

          <div className="bg-black/50 border border-cyber-purple/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-cyber-purple" />
              <span className="text-xs text-cyber-light/50">Total</span>
            </div>
            <div className="text-3xl font-bold text-cyber-purple">{stats?.totalViews || 0}</div>
            <div className="text-sm text-cyber-light/70">Views</div>
          </div>

          <div className="bg-black/50 border border-cyber-green/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-cyber-green" />
              <span className="text-xs text-cyber-light/50">Total</span>
            </div>
            <div className="text-3xl font-bold text-cyber-green">{formatBytes(stats?.totalSize || 0)}</div>
            <div className="text-sm text-cyber-light/70">Storage Used</div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-cyber-light mb-6">Recent Activity</h3>

          <div className="text-center py-12 text-cyber-light/50">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No recent activity</p>
            <p className="text-sm mt-2">Upload your first dataset to get started!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
