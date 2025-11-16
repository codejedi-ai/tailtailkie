import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/datasets/[id]/download - Download dataset as zip
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    // Get dataset with tensors and dimensions
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        user: true,
        tensors: {
          include: {
            dimensions: true,
          },
        },
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Check if dataset is public or belongs to the current user
    if (!dataset.isPublic && dataset.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Record download if user is authenticated
    if (userId) {
      const user = await getOrCreateUser()

      if (user) {
        await prisma.download.create({
          data: {
            userId: user.id,
            datasetId: dataset.id,
          },
        })

        // Increment download count
        await prisma.dataset.update({
          where: { id },
          data: {
            downloadCount: {
              increment: 1,
            },
          },
        })
      }
    }

    // Check if Milvus is configured
    const milvusHost = process.env.MILVUS_HOST || process.env.MILVUS_URI
    if (!milvusHost) {
      return NextResponse.json(
        {
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before downloading files.',
          message: 'File download requires Milvus integration. Please configure MILVUS_HOST or MILVUS_URI environment variables and implement the Milvus connection.',
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // NOTE: File download functionality requires Milvus implementation.
    // Files are not stored locally - implementation will use Milvus vector store.
    // For now, return metadata only.
    const metadata = {
      name: dataset.name,
      description: dataset.description,
      format: dataset.fileFormat,
      tensors: dataset.tensors.map((t) => ({
        fileName: t.fileName,
        shape: JSON.parse(t.shape),
        dtype: t.dtype,
        dimensions: t.dimensions.map((d) => ({
          index: d.index,
          size: d.size,
          name: d.name,
          description: d.description,
        })),
      })),
      created: dataset.createdAt,
      message: 'File download requires Milvus implementation to be completed. Milvus connection is configured but the download handler needs implementation.',
    }

    return NextResponse.json(metadata, {
      status: 501, // 501 Not Implemented
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error downloading dataset:', error)
    return NextResponse.json({ error: 'Failed to download dataset' }, { status: 500 })
  }
}
