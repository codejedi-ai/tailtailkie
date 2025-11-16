import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAllowedFormat } from '@/lib/upload'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/upload - Upload tensor files
// NOTE: File upload requires Milvus vector store to be connected and implemented.
// This endpoint will be functional once Milvus integration is complete.
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Validate file formats
    for (const file of files) {
      if (!isAllowedFormat(file.name)) {
        return NextResponse.json(
          { error: `Invalid file format: ${file.name}. Allowed: .pt, .pth, .npy, .npz, .safetensors, .h5, .hdf5` },
          { status: 400 }
        )
      }
    }

    // Check if Milvus is configured
    const milvusHost = process.env.MILVUS_HOST || process.env.MILVUS_URI
    if (!milvusHost) {
      return NextResponse.json(
        { 
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before uploading files.',
          message: 'File upload requires Milvus integration. Please configure MILVUS_HOST or MILVUS_URI environment variables and implement the Milvus connection.',
          required: 'Milvus vector store connection must be implemented to enable file uploads'
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // Milvus is configured but implementation is not complete
    return NextResponse.json(
      { 
        error: 'File upload functionality requires Milvus implementation to be completed.',
        message: 'Milvus connection is configured but the upload implementation is not yet complete. Please implement the Milvus integration to enable file uploads.',
        status: 'Milvus connection detected but upload handler needs implementation'
      },
      { status: 501 } // 501 Not Implemented
    )
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json({ error: 'Failed to process upload request' }, { status: 500 })
  }
}
