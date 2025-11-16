import formidable from 'formidable'
import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const ALLOWED_FORMATS = ['.pt', '.pth', '.npy', '.npz', '.safetensors', '.h5', '.hdf5']
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

export function isAllowedFormat(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ALLOWED_FORMATS.includes(ext)
}

export async function parseForm(req: NextRequest): Promise<{
  fields: formidable.Fields
  files: formidable.Files
}> {
  // Convert NextRequest to Node.js IncomingMessage-like object
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Create a readable stream from the request
  const chunks: Uint8Array[] = []
  const reader = req.body?.getReader()

  if (!reader) {
    throw new Error('No request body')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  // Concatenate chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const buffer = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }

  // Create form parser
  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB max file size
    filter: function ({ name, originalFilename, mimetype }) {
      // Allow tensor files
      return originalFilename ? isAllowedFormat(originalFilename) : false
    },
  })

  return new Promise((resolve, reject) => {
    // Simulate IncomingMessage for formidable
    const fakeReq: any = {
      headers: headers,
      method: 'POST',
      on: (event: string, handler: Function) => {
        if (event === 'data') {
          handler(buffer)
        } else if (event === 'end') {
          handler()
        }
      },
      pipe: () => {},
    }

    form.parse(fakeReq, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

export async function getFileStats(filePath: string) {
  const stats = await fs.stat(filePath)
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
  }
}
