import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FLASK_API_URL = process.env.FLASK_API_URL || process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000/service/api'

// GET /api/datasets/[id] - Get a single dataset (proxies to Flask)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()

    const url = `${FLASK_API_URL}/datasets/${id}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
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
    console.error('Error fetching dataset:', error)
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 })
  }
}

// PUT /api/datasets/[id] - Update a dataset (proxies to Flask)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const url = `${FLASK_API_URL}/datasets/${id}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating dataset:', error)
    return NextResponse.json({ error: 'Failed to update dataset' }, { status: 500 })
  }
}

// DELETE /api/datasets/[id] - Delete a dataset (proxies to Flask)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { getToken } = await import('@clerk/nextjs/server')
    const token = await getToken()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = `${FLASK_API_URL}/datasets/${id}`

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting dataset:', error)
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 })
  }
}
