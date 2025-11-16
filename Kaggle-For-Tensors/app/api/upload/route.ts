import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FLASK_API_URL = process.env.FLASK_API_URL || process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000/service/api'

// POST /api/upload - Upload tensor files (proxies to Flask)
export async function POST(req: NextRequest) {
  try {
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const url = `${FLASK_API_URL}/upload`

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload files',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
