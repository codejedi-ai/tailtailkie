'use client'

import { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  Database, 
  Upload, 
  TrendingUp, 
  Download, 
  Eye, 
  Plus, 
  ArrowRight,
  Loader2,
  Heart,
  Users,
  Star,
  Award,
  Calendar,
  Mail,
  User,
  LogOut,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Dataset {
  id: string
  name: string
  description: string
  fileFormat: string
  totalSize: number
  downloadCount: number
  viewCount: number
  createdAt: string
  tensors: Array<{
    shape: string
    dtype: string
  }>
}

interface ProfileStats {
  totalDatasets: number
  totalDownloads: number
  totalViews: number
  totalSize: number
  avgDownloadsPerDataset: number
  avgViewsPerDataset: number
  engagementRate: number
  mostPopularDataset: Dataset | null
  totalUsersHelped: number
}

export function DashboardHome() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData()
    }
  }, [isLoaded, user])

  async function fetchDashboardData() {
    try {
      const response = await fetch(`/api/datasets?userId=${user?.id}`)
      const data = await response.json()
      
      const userDatasets = data.datasets || []
      setDatasets(userDatasets)

      const totalDatasets = data.total || 0
      const totalDownloads = userDatasets.reduce((acc: number, d: any) => acc + d.downloadCount, 0)
      const totalViews = userDatasets.reduce((acc: number, d: any) => acc + d.viewCount, 0)
      const totalSize = userDatasets.reduce((acc: number, d: any) => acc + d.totalSize, 0)
      
      // Calculate engagement metrics
      const avgDownloadsPerDataset = totalDatasets > 0 ? totalDownloads / totalDatasets : 0
      const avgViewsPerDataset = totalDatasets > 0 ? totalViews / totalDatasets : 0
      const engagementRate = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0
      
      // Find most popular dataset
      const mostPopularDataset = userDatasets.length > 0
        ? userDatasets.reduce((prev: Dataset, curr: Dataset) => 
            (curr.downloadCount + curr.viewCount) > (prev.downloadCount + prev.viewCount) ? curr : prev
          )
        : null

      // Estimate users helped (unique downloads, approximated)
      const totalUsersHelped = Math.max(totalDownloads, Math.floor(totalDownloads * 0.7))

      setStats({
        totalDatasets,
        totalDownloads,
        totalViews,
        totalSize,
        avgDownloadsPerDataset,
        avgViewsPerDataset,
        engagementRate,
        mostPopularDataset,
        totalUsersHelped,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  function calculateHelpfulnessScore(dataset: Dataset): number {
    // Helpfulness score based on downloads and views ratio
    const engagement = dataset.downloadCount + dataset.viewCount
    const conversionRate = dataset.viewCount > 0 ? (dataset.downloadCount / dataset.viewCount) * 100 : 0
    return Math.min(100, (conversionRate * 0.6) + (engagement / 100) * 0.4)
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    )
  }

  // Sort datasets by popularity (downloads + views)
  const sortedDatasets = [...datasets].sort((a, b) => 
    (b.downloadCount + b.viewCount) - (a.downloadCount + a.viewCount)
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark via-black to-cyber-dark py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Profile Header */}
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
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple bg-clip-text text-transparent">
                {user?.fullName || user?.username || 'Anonymous User'}
              </h1>
              <p className="text-lg text-cyber-light/70 mb-4">
                Tensor Dataset Creator & Contributor
              </p>

              <div className="flex flex-wrap gap-4 text-cyber-light/70 text-sm">
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

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.open(user?.primaryEmailAddress?.emailAddress ? `mailto:${user.primaryEmailAddress.emailAddress}` : '#')}
                variant="outline"
                className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10"
              >
                Edit Profile
              </Button>
              <Button
                onClick={() => signOut({ redirectUrl: '/' })}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-cyber-light mb-6 flex items-center gap-2">
            <Award className="w-8 h-8 text-cyber-purple" />
            Your Impact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 border border-cyber-blue/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-cyber-blue" />
                <TrendingUp className="w-5 h-5 text-cyber-blue/50" />
              </div>
              <div className="text-4xl font-bold text-cyber-blue mb-1">
                {stats?.totalUsersHelped || 0}
              </div>
              <div className="text-sm text-cyber-light/70">People Helped</div>
              <div className="text-xs text-cyber-light/50 mt-2">
                Through dataset downloads
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyber-pink/20 to-cyber-purple/20 border border-cyber-pink/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Heart className="w-10 h-10 text-cyber-pink" />
                <Star className="w-5 h-5 text-cyber-pink/50" />
              </div>
              <div className="text-4xl font-bold text-cyber-pink mb-1">
                {stats?.totalDownloads || 0}
              </div>
              <div className="text-sm text-cyber-light/70">Dataset Likes</div>
              <div className="text-xs text-cyber-light/50 mt-2">
                Total downloads (engagement)
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/20 border border-cyber-purple/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Eye className="w-10 h-10 text-cyber-purple" />
                <TrendingUp className="w-5 h-5 text-cyber-purple/50" />
              </div>
              <div className="text-4xl font-bold text-cyber-purple mb-1">
                {stats?.totalViews || 0}
              </div>
              <div className="text-sm text-cyber-light/70">Total Views</div>
              <div className="text-xs text-cyber-light/50 mt-2">
                People interested in your work
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyber-green/20 to-cyber-blue/20 border border-cyber-green/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <HelpCircle className="w-10 h-10 text-cyber-green" />
                <Award className="w-5 h-5 text-cyber-green/50" />
              </div>
              <div className="text-4xl font-bold text-cyber-green mb-1">
                {stats?.engagementRate ? Math.round(stats.engagementRate) : 0}%
              </div>
              <div className="text-sm text-cyber-light/70">Engagement Rate</div>
              <div className="text-xs text-cyber-light/50 mt-2">
                Downloads per view ratio
              </div>
            </div>
          </div>
        </div>

        {/* Dataset Performance */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-cyber-light flex items-center gap-2">
              <Database className="w-8 h-8 text-cyber-blue" />
              Dataset Performance
            </h2>
            <Link href="/user/datasets">
              <Button variant="outline" className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {sortedDatasets.length === 0 ? (
            <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-12 text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-cyber-light/30" />
              <h3 className="text-xl font-bold text-cyber-light mb-2">No datasets yet</h3>
              <p className="text-cyber-light/70 mb-6">
                Upload your first tensor dataset to start helping others
              </p>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-cyber-pink to-cyber-purple hover:from-cyber-purple hover:to-cyber-pink text-white font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Dataset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDatasets.slice(0, 6).map((dataset) => {
                const helpfulnessScore = calculateHelpfulnessScore(dataset)
                const isPopular = dataset.downloadCount > 0 || dataset.viewCount > 10
                
                return (
                  <Link key={dataset.id} href={`/datasets/${dataset.id}`}>
                    <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-6 hover:border-cyber-pink transition-all hover:shadow-[0_0_20px_rgba(255,0,128,0.3)] cursor-pointer h-full relative">
                      {isPopular && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-cyber-pink/20 border border-cyber-pink rounded-full px-3 py-1 text-xs text-cyber-pink font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Popular
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-cyber-light flex-1 pr-2">{dataset.name}</h3>
                        <span className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded font-mono">
                          .{dataset.fileFormat}
                        </span>
                      </div>

                      <p className="text-cyber-light/70 text-sm mb-4 line-clamp-2">
                        {dataset.description || 'No description provided'}
                      </p>

                      {/* Helpfulness Score */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-cyber-light/50">Helpfulness Score</span>
                          <span className="text-cyber-green font-bold">{Math.round(helpfulnessScore)}%</span>
                        </div>
                        <div className="w-full bg-cyber-dark rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyber-green to-cyber-blue h-2 rounded-full transition-all"
                            style={{ width: `${helpfulnessScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-cyber-light/50 mb-2">
                        <span>{formatBytes(dataset.totalSize)}</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-cyber-pink" />
                            {dataset.downloadCount} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-cyber-purple" />
                            {dataset.viewCount} views
                          </span>
                        </div>
                      </div>

                      {/* Impact indicator */}
                      {dataset.downloadCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-cyber-blue/20">
                          <div className="text-xs text-cyber-green flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Helping {dataset.downloadCount} {dataset.downloadCount === 1 ? 'person' : 'people'} with their work
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/upload">
            <div className="bg-gradient-to-br from-cyber-pink/20 to-cyber-purple/20 border border-cyber-pink/30 rounded-lg p-6 hover:border-cyber-pink transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <Upload className="w-8 h-8 text-cyber-pink" />
                <ArrowRight className="w-5 h-5 text-cyber-pink/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-cyber-light mb-2">Upload Dataset</h3>
              <p className="text-cyber-light/70 text-sm">
                Share your tensor datasets and help the community
              </p>
            </div>
          </Link>

          <Link href="/datasets">
            <div className="bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 border border-cyber-blue/30 rounded-lg p-6 hover:border-cyber-blue transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-cyber-blue" />
                <ArrowRight className="w-5 h-5 text-cyber-blue/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-cyber-light mb-2">Browse Datasets</h3>
              <p className="text-cyber-light/70 text-sm">
                Discover tensor datasets from the community
              </p>
            </div>
          </Link>

          <Link href="/user/analytics">
            <div className="bg-gradient-to-br from-cyber-purple/20 to-cyber-pink/20 border border-cyber-purple/30 rounded-lg p-6 hover:border-cyber-purple transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-cyber-purple" />
                <ArrowRight className="w-5 h-5 text-cyber-purple/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-cyber-light mb-2">View Analytics</h3>
              <p className="text-cyber-light/70 text-sm">
                Track detailed performance metrics
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
