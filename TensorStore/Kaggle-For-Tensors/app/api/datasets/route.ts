import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FLASK_API_URL = process.env.FLASK_API_URL || process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000/service/api'

// GET /api/datasets - List datasets with filtering (proxies to Flask)
export async function GET(req: NextRequest) {
  try {
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()
    
    const searchParams = req.nextUrl.searchParams
    const url = new URL(`${FLASK_API_URL}/datasets`)
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching datasets:', error)
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 })
  }
}

// POST /api/datasets - Create a new dataset (proxies to Flask)
export async function POST(req: NextRequest) {
  try {
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const url = `${FLASK_API_URL}/datasets`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dataset:', error)
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 })
  }
}
