import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAllowedFormat } from '@/lib/upload'
import { isMilvusConfigured } from '@/lib/milvus'
import getMilvusClient from '@/lib/milvus'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Temporary storage collection for uploaded files before dataset creation
const TEMP_FILES_COLLECTION = 'temp_tensor_files'

// POST /api/upload - Upload tensor files (temporary storage)
// Files are stored temporarily and will be processed into vectors when dataset is created
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Milvus is configured
    if (!isMilvusConfigured()) {
      return NextResponse.json(
        { 
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before uploading files.',
          message: 'File upload requires Milvus integration. Please configure MILVUS_URI and MILVUS_TOKEN environment variables.',
        },
        { status: 503 } // 503 Service Unavailable
      )
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

    // Get Milvus client
    const milvusClient = await getMilvusClient()
    
    // Dynamic import to avoid build-time issues
    const { DataType } = await import('@zilliz/milvus2-sdk-node')

    // Ensure temporary collection exists
    const collectionExists = await milvusClient.hasCollection({
      collection_name: TEMP_FILES_COLLECTION,
    })

    if (!collectionExists) {
      // Create temporary collection for storing uploaded files before processing
      await milvusClient.createCollection({
        collection_name: TEMP_FILES_COLLECTION,
        description: 'Temporary storage for uploaded tensor files before dataset creation',
        fields: [
          {
            name: 'id',
            type: DataType.VarChar,
            is_primary_key: true,
            max_length: 255,
          },
          {
            name: 'file_name',
            type: DataType.VarChar,
            max_length: 500,
          },
          {
            name: 'user_id',
            type: DataType.VarChar,
            max_length: 255,
          },
          {
            name: 'file_data',
            type: DataType.VarChar,
            max_length: 10000000, // Store base64-encoded file data
          },
          {
            name: 'file_size',
            type: DataType.Int64,
          },
          {
            name: 'uploaded_at',
            type: DataType.Int64,
          },
        ],
      })
    }

    // Upload files to temporary storage
    const uploadedFiles: Array<{
      fileName: string
      originalName: string
      size: number
      milvusId: string
    }> = []

    for (const file of files) {
      // Generate unique ID for this file
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileId = `${timestamp}-${randomStr}-${file.name}`

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Store file temporarily (will be processed into vectors when dataset is created)
      const fileData = {
        id: fileId,
        file_name: file.name,
        user_id: userId,
        file_data: buffer.toString('base64'),
        file_size: file.size,
        uploaded_at: timestamp,
      }

      // Insert into temporary collection
      await milvusClient.insert({
        collection_name: TEMP_FILES_COLLECTION,
        data: [fileData],
      })

      uploadedFiles.push({
        fileName: fileId,
        originalName: file.name,
        size: file.size,
        milvusId: fileId,
      })
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 200 })
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
