import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'
import { CreateDatasetSchema } from '@/lib/types'
import { ensureUploadDir, UPLOAD_DIR } from '@/lib/upload'
import path from 'path'
import fs from 'fs/promises'

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

    await ensureUploadDir()

    // Calculate total size from all tensors
    let totalSize = 0
    const tensorFiles: string[] = []

    for (const tensor of validatedData.tensors) {
      const filePath = path.join(UPLOAD_DIR, tensor.fileName)
      try {
        const stats = await fs.stat(filePath)
        totalSize += stats.size
        tensorFiles.push(tensor.fileName)
      } catch (error) {
        return NextResponse.json(
          { error: `Tensor file not found: ${tensor.fileName}` },
          { status: 400 }
        )
      }
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
          create: validatedData.tensors.map((tensor) => ({
            fileName: tensor.fileName,
            filePath: path.relative(process.cwd(), path.join(UPLOAD_DIR, tensor.fileName)),
            fileSize: 0, // Will be updated
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
          })),
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

    // Update tensor file sizes
    for (const tensor of dataset.tensors) {
      const filePath = path.join(process.cwd(), tensor.filePath)
      const stats = await fs.stat(filePath)
      await prisma.tensor.update({
        where: { id: tensor.id },
        data: { fileSize: stats.size },
      })
    }

    return NextResponse.json(dataset, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dataset:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 })
  }
}
