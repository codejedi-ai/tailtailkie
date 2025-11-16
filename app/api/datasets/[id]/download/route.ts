import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'
import { isMilvusConfigured, getCollectionName } from '@/lib/milvus'
import getMilvusClient from '@/lib/milvus'

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
    if (!isMilvusConfigured()) {
      return NextResponse.json(
        {
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before downloading files.',
          message: 'File download requires Milvus integration. Please configure MILVUS_URI and MILVUS_TOKEN environment variables.',
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // Get Milvus client
    const milvusClient = await getMilvusClient()

    // Get the dataset's Milvus collection
    const collectionName = getCollectionName(dataset.id)

    // Check if collection exists
    const collectionExists = await milvusClient.hasCollection({
      collection_name: collectionName,
    })

    if (!collectionExists) {
      return NextResponse.json(
        { error: 'Dataset collection not found in Milvus. Vectors may not have been processed yet.' },
        { status: 404 }
      )
    }

    // If single tensor, reconstruct and return it
    if (dataset.tensors.length === 1) {
      const tensor = dataset.tensors[0]
      const shape = JSON.parse(tensor.shape) as number[]
      
      // Query all vectors from the collection for this tensor
      const queryResult = await milvusClient.query({
        collection_name: collectionName,
        expr: `tensor_id == "${tensor.id}"`,
        output_fields: ['vector', 'index'],
        limit: shape[0], // N - number of vectors
      })

      if (!queryResult || queryResult.length === 0) {
        return NextResponse.json(
          { error: 'No vectors found in Milvus for this tensor. Tensor may not have been processed yet.' },
          { status: 404 }
        )
      }

      // Sort by index to maintain order
      queryResult.sort((a: any, b: any) => a.index - b.index)

      // Reconstruct tensor from vectors
      // TODO: Implement tensor reconstruction
      // This requires:
      // 1. Unflattening vectors back into original shape
      // 2. Converting back to the original tensor format (.pt, .npy, etc.)
      // 3. Returning the file
      //
      // For now, return metadata indicating reconstruction is needed
      return NextResponse.json(
        {
          error: 'Tensor reconstruction from vectors is not yet implemented',
          message: 'Vectors are stored in Milvus but tensor file reconstruction needs to be implemented.',
          tensor: {
            fileName: tensor.fileName,
            shape: shape,
            dtype: tensor.dtype,
            vectorCount: queryResult.length,
          },
        },
        { status: 501 } // 501 Not Implemented
      )
    }

    // Multiple tensors - return metadata
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
        downloadUrl: `/api/datasets/${id}/download/${t.id}`,
      })),
      created: dataset.createdAt,
      message: 'Multiple tensors detected. Tensor reconstruction from Milvus vectors needs to be implemented.',
    }

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error downloading dataset:', error)
    return NextResponse.json({ error: 'Failed to download dataset' }, { status: 500 })
  }
}
