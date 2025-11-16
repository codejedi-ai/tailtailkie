import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import { Readable } from 'stream'

// GET /api/datasets/[id]/download - Download dataset as zip
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    // Get dataset with tensors
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        user: true,
        tensors: true,
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

    // If single file, return directly
    if (dataset.tensors.length === 1) {
      const tensor = dataset.tensors[0]
      const filePath = path.join(process.cwd(), tensor.filePath)
      const fileBuffer = await readFile(filePath)

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${tensor.fileName}"`,
        },
      })
    }

    // Multiple files - create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    // Add metadata file
    const metadata = {
      name: dataset.name,
      description: dataset.description,
      format: dataset.fileFormat,
      tensors: dataset.tensors.map((t) => ({
        fileName: t.fileName,
        shape: JSON.parse(t.shape),
        dtype: t.dtype,
      })),
      created: dataset.createdAt,
    }

    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

    // Add all tensor files
    for (const tensor of dataset.tensors) {
      const filePath = path.join(process.cwd(), tensor.filePath)
      const fileBuffer = await readFile(filePath)
      archive.append(fileBuffer, { name: tensor.fileName })
    }

    await archive.finalize()

    // Convert archive stream to NextResponse
    const chunks: Uint8Array[] = []

    return new Promise<NextResponse>((resolve, reject) => {
      archive.on('data', (chunk: any) => chunks.push(new Uint8Array(chunk)))
      archive.on('end', () => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          result.set(chunk, offset)
          offset += chunk.length
        }
        resolve(
          new NextResponse(result, {
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${dataset.name.replace(/[^a-z0-9]/gi, '_')}.zip"`,
            },
          })
        )
      })
      archive.on('error', reject)
    })
  } catch (error) {
    console.error('Error downloading dataset:', error)
    return NextResponse.json({ error: 'Failed to download dataset' }, { status: 500 })
  }
}
