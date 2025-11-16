import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'
import { CreateDatasetSchema } from '@/lib/types'
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
    const milvusHost = process.env.MILVUS_HOST || process.env.MILVUS_URI
    if (!milvusHost) {
      return NextResponse.json(
        {
          error: 'Milvus vector store is not configured. Please connect and implement Milvus before creating datasets with files.',
          message: 'Dataset creation with files requires Milvus integration. Please configure MILVUS_HOST or MILVUS_URI environment variables.',
        },
        { status: 503 } // 503 Service Unavailable
      )
    }

    // NOTE: File storage requires Milvus implementation. Planned implementation will use Milvus.
    // For now, we'll create dataset metadata without file validation.
    // Calculate total size from tensor metadata (estimated)
    let totalSize = 0
    for (const tensor of validatedData.tensors) {
      // Estimate size based on shape and dtype (rough approximation)
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

    // Create dataset with tensors and dimensions
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

    // File sizes are already estimated during creation
    // Actual file storage will be handled by Milvus when implemented

    return NextResponse.json(dataset, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dataset:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 })
  }
}
