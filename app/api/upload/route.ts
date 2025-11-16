import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { ensureUploadDir, UPLOAD_DIR, isAllowedFormat } from '@/lib/upload'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/upload - Upload tensor files
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUploadDir()

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const uploadedFiles: Array<{
      fileName: string
      originalName: string
      size: number
      path: string
    }> = []

    for (const file of files) {
      if (!isAllowedFormat(file.name)) {
        return NextResponse.json(
          { error: `Invalid file format: ${file.name}. Allowed: .pt, .pth, .npy, .npz, .safetensors, .h5, .hdf5` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(7)
      const fileName = `${timestamp}-${randomStr}-${file.name}`
      const filePath = join(UPLOAD_DIR, fileName)

      // Convert File to Buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = new Uint8Array(bytes)
      await writeFile(filePath, buffer)

      uploadedFiles.push({
        fileName,
        originalName: file.name,
        size: file.size,
        path: filePath,
      })
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 200 })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 })
  }
}
