'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
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
  Sparkles
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

interface DashboardStats {
  totalDatasets: number
  totalDownloads: number
  totalViews: number
  totalSize: number
}

export function DashboardHome() {
  const { user, isLoaded } = useUser()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData()
    }
  }, [isLoaded, user])

  async function fetchDashboardData() {
    try {
      const response = await fetch(`/api/datasets?userId=${user?.id}&limit=6`)
      const data = await response.json()
      
      const userDatasets = data.datasets || []
      setDatasets(userDatasets)

      const totalDatasets = data.total || 0
      const totalDownloads = userDatasets.reduce((acc: number, d: any) => acc + d.downloadCount, 0)
      const totalViews = userDatasets.reduce((acc: number, d: any) => acc + d.viewCount, 0)
      const totalSize = userDatasets.reduce((acc: number, d: any) => acc + d.totalSize, 0)

      setStats({
        totalDatasets,
        totalDownloads,
        totalViews,
        totalSize,
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

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-dark via-black to-cyber-dark py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyber-blue via-cyber-pink to-cyber-purple bg-clip-text text-transparent">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-xl text-cyber-light/70">
            Manage your tensor datasets and track your impact
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-6 hover:border-cyber-blue transition-all">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-10 h-10 text-cyber-blue" />
              <Sparkles className="w-5 h-5 text-cyber-blue/50" />
            </div>
            <div className="text-4xl font-bold text-cyber-blue mb-1">
              {stats?.totalDatasets || 0}
            </div>
            <div className="text-sm text-cyber-light/70">Total Datasets</div>
          </div>

          <div className="bg-black/50 border border-cyber-pink/30 rounded-lg p-6 hover:border-cyber-pink transition-all">
            <div className="flex items-center justify-between mb-4">
              <Download className="w-10 h-10 text-cyber-pink" />
              <TrendingUp className="w-5 h-5 text-cyber-pink/50" />
            </div>
            <div className="text-4xl font-bold text-cyber-pink mb-1">
              {stats?.totalDownloads || 0}
            </div>
            <div className="text-sm text-cyber-light/70">Total Downloads</div>
          </div>

          <div className="bg-black/50 border border-cyber-purple/30 rounded-lg p-6 hover:border-cyber-purple transition-all">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-10 h-10 text-cyber-purple" />
              <TrendingUp className="w-5 h-5 text-cyber-purple/50" />
            </div>
            <div className="text-4xl font-bold text-cyber-purple mb-1">
              {stats?.totalViews || 0}
            </div>
            <div className="text-sm text-cyber-light/70">Total Views</div>
          </div>

          <div className="bg-black/50 border border-cyber-green/30 rounded-lg p-6 hover:border-cyber-green transition-all">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-10 h-10 text-cyber-green" />
              <Sparkles className="w-5 h-5 text-cyber-green/50" />
            </div>
            <div className="text-4xl font-bold text-cyber-green mb-1">
              {stats?.totalSize ? formatBytes(stats.totalSize) : '0 B'}
            </div>
            <div className="text-sm text-cyber-light/70">Total Storage</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/upload">
            <div className="bg-gradient-to-br from-cyber-pink/20 to-cyber-purple/20 border border-cyber-pink/30 rounded-lg p-6 hover:border-cyber-pink transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <Upload className="w-8 h-8 text-cyber-pink" />
                <ArrowRight className="w-5 h-5 text-cyber-pink/50 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-cyber-light mb-2">Upload Dataset</h3>
              <p className="text-cyber-light/70 text-sm">
                Share your tensor datasets with the community
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
                Track performance and insights
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Datasets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-cyber-light">Recent Datasets</h2>
            <Link href="/user/datasets">
              <Button variant="outline" className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/10">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {datasets.length === 0 ? (
            <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-12 text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-cyber-light/30" />
              <h3 className="text-xl font-bold text-cyber-light mb-2">No datasets yet</h3>
              <p className="text-cyber-light/70 mb-6">
                Upload your first tensor dataset to get started
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
              {datasets.map((dataset) => (
                <Link key={dataset.id} href={`/datasets/${dataset.id}`}>
                  <div className="bg-black/50 border border-cyber-blue/30 rounded-lg p-6 hover:border-cyber-pink transition-all hover:shadow-[0_0_20px_rgba(255,0,128,0.3)] cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-cyber-light flex-1">{dataset.name}</h3>
                      <span className="px-2 py-1 bg-cyber-blue/20 text-cyber-blue text-xs rounded font-mono">
                        .{dataset.fileFormat}
                      </span>
                    </div>

                    <p className="text-cyber-light/70 text-sm mb-4 line-clamp-2">
                      {dataset.description || 'No description provided'}
                    </p>

                    {dataset.tensors.length > 0 && (
                      <div className="mb-4 text-xs">
                        <div className="text-cyber-light/50">Shape:</div>
                        <div className="text-cyber-purple font-mono">
                          {JSON.parse(dataset.tensors[0].shape).join(' × ')}
                        </div>
                        <div className="text-cyber-light/50 mt-1">
                          Type: <span className="text-cyber-green">{dataset.tensors[0].dtype}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-cyber-light/50">
                      <span>{formatBytes(dataset.totalSize)}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {dataset.downloadCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {dataset.viewCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

