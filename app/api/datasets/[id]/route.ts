import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UpdateDatasetSchema } from '@/lib/types'
import fs from 'fs/promises'
import path from 'path'

// GET /api/datasets/[id] - Get a single dataset
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            username: true,
            email: true,
          },
        },
        tensors: {
          include: {
            dimensions: {
              orderBy: {
                index: 'asc',
              },
            },
          },
        },
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Check if dataset is public or belongs to the current user
    const { userId } = await auth()
    if (!dataset.isPublic && dataset.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Increment view count
    await prisma.dataset.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(dataset)
  } catch (error) {
    console.error('Error fetching dataset:', error)
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 })
  }
}

// PUT /api/datasets/[id] - Update a dataset
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if dataset exists and belongs to the user
    const existingDataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!existingDataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    if (existingDataset.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = UpdateDatasetSchema.parse(body)

    const updatedDataset = await prisma.dataset.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
        isPublic: validatedData.isPublic,
      },
      include: {
        tensors: {
          include: {
            dimensions: true,
          },
        },
      },
    })

    return NextResponse.json(updatedDataset)
  } catch (error: any) {
    console.error('Error updating dataset:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update dataset' }, { status: 500 })
  }
}

// DELETE /api/datasets/[id] - Delete a dataset
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if dataset exists and belongs to the user
    const existingDataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        user: true,
        tensors: true,
      },
    })

    if (!existingDataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    if (existingDataset.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete tensor files
    for (const tensor of existingDataset.tensors) {
      try {
        const filePath = path.join(process.cwd(), tensor.filePath)
        await fs.unlink(filePath)
      } catch (error) {
        console.error(`Failed to delete file: ${tensor.filePath}`, error)
      }
    }

    // Delete dataset (cascades to tensors and dimensions)
    await prisma.dataset.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dataset:', error)
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 })
  }
}
