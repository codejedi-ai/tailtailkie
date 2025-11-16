import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'
import { CreateDatasetSchema } from '@/lib/types'
import { isMilvusConfigured, getCollectionName, calculateVectorDimension } from '@/lib/milvus'
import getMilvusClient from '@/lib/milvus'
import { DataType } from '@zilliz/milvus2-sdk-node'
import path from 'path'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/datasets - List datasets with filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const userId = searchParams.get('userId') || undefined
    const format = searchParams.get('format') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      isPublic: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (userId) {
      // userId could be a Clerk ID (starts with "user_") or MongoDB ObjectID
      // If it's a Clerk ID, look up the user first
      if (userId.startsWith('user_')) {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        })
        if (!user) {
          // User not found, return empty result
          return NextResponse.json({
            datasets: [],
            total: 0,
            limit,
            offset,
          })
        }
        where.userId = user.id
      } else {
        // Assume it's already a MongoDB ObjectID
        where.userId = userId
      }
      delete where.isPublic // Allow private datasets for user's own datasets
    }

    if (format) {
      where.fileFormat = format
    }

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          tensors: {
            include: {
              dimensions: true,
            },
          },
          _count: {
            select: {
              downloads: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.dataset.count({ where }),
    ])

    return NextResponse.json({
      datasets,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching datasets:', error)
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 })
  }
}

// POST /api/datasets - Create a new dataset
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user in database (handles race condition with webhook)
    const user = await getOrCreateUser()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const validatedData = CreateDatasetSchema.parse(body)

    // Check if Milvus is configured
    if (!isMilvusConfigured()) {
      return NextResponse.json(
        {
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before creating datasets with files.',
          message: 'Dataset creation with files requires Milvus integration. Please configure MILVUS_URI and MILVUS_TOKEN environment variables.',
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // Get Milvus client
    const milvusClient = await getMilvusClient()

    // Calculate total size from tensor metadata
    let totalSize = 0
    for (const tensor of validatedData.tensors) {
      const shape = tensor.shape
      const elementCount = shape.reduce((acc: number, dim: number) => acc * dim, 1)
      const bytesPerElement = tensor.dtype.includes('float64') || tensor.dtype.includes('int64') ? 8 :
                              tensor.dtype.includes('float32') || tensor.dtype.includes('int32') ? 4 :
                              tensor.dtype.includes('float16') || tensor.dtype.includes('int16') ? 2 : 1
      totalSize += elementCount * bytesPerElement
    }

    // Determine file format from first tensor
    const firstTensor = validatedData.tensors[0]
    const ext = path.extname(firstTensor.fileName).toLowerCase().replace('.', '')
    const fileFormat = ext === 'pth' ? 'pt' : ext === 'hdf5' ? 'h5' : ext

    // Create dataset in MongoDB first (to get the dataset ID)
    const dataset = await prisma.dataset.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: user.id,
        totalSize,
        fileFormat,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        isPublic: validatedData.isPublic,
        tensors: {
          create: validatedData.tensors.map((tensor) => {
            // Estimate file size
            const elementCount = tensor.shape.reduce((acc: number, dim: number) => acc * dim, 1)
            const bytesPerElement = tensor.dtype.includes('float64') || tensor.dtype.includes('int64') ? 8 :
                                    tensor.dtype.includes('float32') || tensor.dtype.includes('int32') ? 4 :
                                    tensor.dtype.includes('float16') || tensor.dtype.includes('int16') ? 2 : 1
            const estimatedFileSize = elementCount * bytesPerElement

            return {
              fileName: tensor.fileName,
              filePath: `milvus://${tensor.fileName}`, // Placeholder for Milvus storage
              fileSize: estimatedFileSize,
              shape: JSON.stringify(tensor.shape),
              dtype: tensor.dtype,
              dimensions: {
                create: tensor.dimensions.map((dim) => ({
                  index: dim.index,
                  size: dim.size,
                  name: dim.name,
                  description: dim.description,
                })),
              },
            }
          }),
        },
      },
      include: {
        tensors: {
          include: {
            dimensions: true,
          },
        },
      },
    })

    // Create Milvus collection for this dataset
    // Each dataset gets its own collection where each vector represents one unit from the first axis
    const collectionName = getCollectionName(dataset.id)
    
    // Calculate vector dimension from first tensor (all tensors in a dataset should have same vector dim)
    const vectorDim = calculateVectorDimension(validatedData.tensors[0].shape)
    const batchSize = validatedData.tensors[0].shape[0] // N - number of vectors

    // Check if collection already exists
    const collectionExists = await milvusClient.hasCollection({
      collection_name: collectionName,
    })

    if (!collectionExists) {
      // Create collection for storing vectors
      // Schema: id (primary key), vector (flattened tensor data), tensor_id (which tensor file), index (position in batch)
      await milvusClient.createCollection({
        collection_name: collectionName,
        description: `Dataset: ${validatedData.name}`,
        fields: [
          {
            name: 'id',
            type: DataType.VarChar,
            is_primary_key: true,
            max_length: 255,
          },
          {
            name: 'vector',
            type: DataType.FloatVector,
            dim: vectorDim,
          },
          {
            name: 'tensor_id',
            type: DataType.VarChar,
            max_length: 255,
          },
          {
            name: 'index',
            type: DataType.Int64, // Position in the batch (0 to N-1)
          },
        ],
      })

      // Create index for vector similarity search
      await milvusClient.createIndex({
        collection_name: collectionName,
        field_name: 'vector',
        index_type: 'HNSW',
        metric_type: 'L2',
        params: {
          M: 16,
          efConstruction: 200,
        },
      })

      // Load collection for querying
      await milvusClient.loadCollection({
        collection_name: collectionName,
      })
    }

    // TODO: Parse tensor files and extract vectors
    // This requires parsing .pt, .npy, .safetensors, .h5 files
    // Options:
    // 1. Use a Python microservice/API to parse tensors
    // 2. Use Node.js libraries (limited support)
    // 3. Require users to provide pre-parsed data
    // 
    // For each tensor file:
    // 1. Retrieve from temporary storage (TEMP_FILES_COLLECTION)
    // 2. Parse tensor file based on format
    // 3. Extract vectors: flatten dimensions 1+ for each unit in dimension 0
    // 4. Insert vectors into Milvus collection
    //
    // Example for shape (N, 12, 8, 8):
    // - N vectors
    // - Each vector: 12 * 8 * 8 = 768 dimensions (flattened)
    // - Insert N rows into Milvus

    // NOTE: Tensor parsing implementation needed
    // For now, we create the collection structure but don't populate it yet
    console.log(`Created Milvus collection: ${collectionName} with vector dimension: ${vectorDim}, expected ${batchSize} vectors`)

    return NextResponse.json(dataset, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dataset:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 })
  }
}
