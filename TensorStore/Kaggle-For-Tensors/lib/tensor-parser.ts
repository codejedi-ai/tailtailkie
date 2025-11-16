/**
 * Tensor Parser Utility
 * Parses tensor files (.npy, .npz, .safetensors) and extracts vectors for Milvus
 * 
 * Note: PyTorch (.pt) files require Python and are not supported in pure TypeScript
 * For .pt files, consider using a Python microservice or requiring pre-converted formats
 */

export interface ParsedTensor {
  data: number[]
  shape: number[]
  dtype: string
}

export interface TensorParseResult {
  success: boolean
  data?: ParsedTensor
  error?: string
}

/**
 * Parse a tensor file based on its format
 */
export async function parseTensorFile(
  fileBuffer: Buffer,
  fileName: string,
  _expectedShape?: number[],
  _expectedDtype?: string
): Promise<TensorParseResult> {
  const ext = fileName.toLowerCase().split('.').pop()

  try {
    switch (ext) {
      case 'npy':
        return await parseNpyFile(fileBuffer)
      case 'npz':
        return await parseNpzFile(fileBuffer, fileName)
      case 'safetensors':
        return await parseSafetensorsFile(fileBuffer)
      case 'pt':
      case 'pth':
        return {
          success: false,
          error: 'PyTorch (.pt/.pth) files require Python. Please convert to .npy or .safetensors format, or use a Python microservice.',
        }
      case 'h5':
      case 'hdf5':
        return {
          success: false,
          error: 'HDF5 (.h5/.hdf5) files are not yet supported. Please convert to .npy or .safetensors format.',
        }
      default:
        return {
          success: false,
          error: `Unsupported file format: .${ext}`,
        }
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to parse tensor file: ${error.message}`,
    }
  }
}

/**
 * Parse .npy (NumPy) file
 * Format specification: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html
 */
async function parseNpyFile(buffer: Buffer): Promise<TensorParseResult> {
  try {
    // Use npyjs library for parsing
    const npyjs = await import('npyjs')
    const npyLoader = new npyjs.default()
    
    // Parse the buffer - convert Buffer to ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer
    const result = await npyLoader.load(arrayBuffer)
    
    // Convert to flat array of numbers
    // npyjs returns data as TypedArray, convert to regular array
    const typedArray = result.data as unknown as ArrayLike<number>
    const data: number[] = []
    const length = 'length' in typedArray ? typedArray.length : 0
    for (let i = 0; i < length; i++) {
      const val = typedArray[i]
      if (typeof val === 'number') {
        data.push(val)
      } else if (typeof val === 'bigint') {
        data.push(Number(val))
      } else {
        data.push(parseFloat(String(val)))
      }
    }
    
    // Get shape and dtype
    const shape = result.shape || []
    const dtype = result.dtype || 'float32'
    
    return {
      success: true,
      data: {
        data,
        shape,
        dtype: normalizeDtype(dtype),
      },
    }
  } catch (error: any) {
    // Fallback: try manual parsing for simple cases
    return {
      success: false,
      error: `Failed to parse .npy file: ${error.message}. Please ensure npyjs is installed: pnpm add npyjs`,
    }
  }
}

/**
 * Parse .npz (NumPy compressed) file
 * This is a ZIP archive containing multiple .npy files
 */
async function parseNpzFile(buffer: Buffer, _fileName: string): Promise<TensorParseResult> {
  try {
    // npz files are ZIP archives containing .npy files
    // For now, we'll try to extract the first array
    // In a full implementation, you might want to handle multiple arrays
    
    // Use JSZip to extract files
    const JSZip = (await import('jszip')).default
    // Convert Buffer to Uint8Array for JSZip
    const uint8Array = new Uint8Array(buffer)
    const zip = await JSZip.loadAsync(uint8Array)
    
    // Get the first .npy file (or use a convention like 'arr_0.npy')
    const fileNames = Object.keys(zip.files).filter(name => name.endsWith('.npy'))
    
    if (fileNames.length === 0) {
      return {
        success: false,
        error: 'No .npy files found in .npz archive',
      }
    }
    
    // Use the first file (or you could look for a specific name)
    const firstFile = fileNames[0]
    const npyBuffer = await zip.files[firstFile].async('arraybuffer')
    
    // Parse the extracted .npy file
    return await parseNpyFile(Buffer.from(npyBuffer))
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to parse .npz file: ${error.message}. Please ensure jszip is installed: pnpm add jszip`,
    }
  }
}

/**
 * Parse .safetensors file
 * Format specification: https://huggingface.co/docs/safetensors/index
 * 
 * Note: Pure TypeScript/Node.js parsing of safetensors is complex.
 * For production, consider using a Python microservice or converting to .npy format.
 * This is a basic implementation that may need enhancement.
 */
async function parseSafetensorsFile(buffer: Buffer): Promise<TensorParseResult> {
  try {
    // Safetensors format is a binary format with a header
    // For now, we'll provide a basic structure
    // Full implementation would require parsing the binary format manually
    // or using a Python service
    
    // Check if buffer is large enough for safetensors header (8 bytes minimum)
    if (buffer.length < 8) {
      return {
        success: false,
        error: 'File too small to be a valid safetensors file',
      }
    }
    
    // Safetensors files start with a header that contains JSON metadata
    // The first 8 bytes are the header length (little-endian uint64)
    const headerLength = buffer.readUInt32LE(0) + (buffer.readUInt32LE(4) * 0x100000000)
    
    if (headerLength > buffer.length - 8 || headerLength < 0) {
      return {
        success: false,
        error: 'Invalid safetensors header length',
      }
    }
    
    // Extract and parse JSON header
    const headerJson = buffer.subarray(8, 8 + headerLength).toString('utf-8')
    const header = JSON.parse(headerJson)
    
    // Get the first tensor (or you could specify which one)
    const tensorNames = Object.keys(header).filter(key => key !== '__metadata__')
    if (tensorNames.length === 0) {
      return {
        success: false,
        error: 'No tensors found in safetensors file',
      }
    }
    
    // Use the first tensor
    const tensorName = tensorNames[0]
    const tensorInfo = header[tensorName]
    
    if (!tensorInfo.data_offsets || !tensorInfo.shape || !tensorInfo.dtype) {
      return {
        success: false,
        error: 'Invalid tensor metadata in safetensors file',
      }
    }
    
    // Calculate data offset (header ends at 8 + headerLength, then data starts)
    const dataStart = 8 + headerLength
    const tensorStart = dataStart + tensorInfo.data_offsets[0]
    const tensorEnd = dataStart + tensorInfo.data_offsets[1]
    const tensorData = buffer.subarray(tensorStart, tensorEnd)
    
    // Parse data based on dtype
    const numberData = parseTensorDataByDtype(tensorData, tensorInfo.dtype, tensorInfo.shape)
    
    return {
      success: true,
      data: {
        data: numberData,
        shape: tensorInfo.shape,
        dtype: normalizeDtype(tensorInfo.dtype),
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to parse .safetensors file: ${error.message}. Consider converting to .npy format or using a Python microservice for full support.`,
    }
  }
}

/**
 * Parse tensor data buffer based on dtype
 */
function parseTensorDataByDtype(
  buffer: Buffer,
  dtype: string,
  shape: number[]
): number[] {
  const normalizedDtype = normalizeDtype(dtype)
  const elementCount = shape.reduce((acc, dim) => acc * dim, 1)
  const result: number[] = []
  
  let bytesPerElement = 0
  let readFunction: (buffer: Buffer, offset: number) => number
  
  switch (normalizedDtype) {
    case 'float32':
    case 'f32':
      bytesPerElement = 4
      readFunction = (buf, off) => buf.readFloatLE(off)
      break
    case 'float64':
    case 'f64':
    case 'double':
      bytesPerElement = 8
      readFunction = (buf, off) => buf.readDoubleLE(off)
      break
    case 'float16':
    case 'f16':
    case 'half':
      bytesPerElement = 2
      // Float16 requires special handling - for now, convert to float32
      readFunction = (buf, off) => {
        const uint16 = buf.readUInt16LE(off)
        // Simple float16 to float32 conversion (approximate)
        const sign = (uint16 >> 15) & 0x1
        const exp = (uint16 >> 10) & 0x1f
        const mantissa = uint16 & 0x3ff
        if (exp === 0) return (sign ? -1 : 1) * (mantissa / 1024) * Math.pow(2, -14)
        if (exp === 31) return mantissa === 0 ? (sign ? -Infinity : Infinity) : NaN
        return (sign ? -1 : 1) * (1 + mantissa / 1024) * Math.pow(2, exp - 15)
      }
      break
    case 'int32':
    case 'i32':
      bytesPerElement = 4
      readFunction = (buf, off) => buf.readInt32LE(off)
      break
    case 'int64':
    case 'i64':
      bytesPerElement = 8
      readFunction = (buf, off) => Number(buf.readBigInt64LE(off))
      break
    case 'int16':
    case 'i16':
      bytesPerElement = 2
      readFunction = (buf, off) => buf.readInt16LE(off)
      break
    case 'int8':
    case 'i8':
      bytesPerElement = 1
      readFunction = (buf, off) => buf.readInt8(off)
      break
    case 'uint8':
    case 'u8':
      bytesPerElement = 1
      readFunction = (buf, off) => buf.readUInt8(off)
      break
    default:
      throw new Error(`Unsupported dtype: ${dtype}`)
  }
  
  const expectedSize = elementCount * bytesPerElement
  if (buffer.length < expectedSize) {
    throw new Error(`Buffer too small: expected ${expectedSize} bytes, got ${buffer.length}`)
  }
  
  for (let i = 0; i < elementCount; i++) {
    const offset = i * bytesPerElement
    result.push(readFunction(buffer, offset))
  }
  
  return result
}

/**
 * Normalize dtype string to standard format
 */
function normalizeDtype(dtype: string): string {
  const normalized = dtype.toLowerCase()
  
  // Map common variations
  if (normalized.includes('float32') || normalized.includes('f32')) return 'float32'
  if (normalized.includes('float64') || normalized.includes('f64') || normalized.includes('double')) return 'float64'
  if (normalized.includes('float16') || normalized.includes('f16') || normalized.includes('half')) return 'float16'
  if (normalized.includes('int32') || normalized.includes('i32')) return 'int32'
  if (normalized.includes('int64') || normalized.includes('i64')) return 'int64'
  if (normalized.includes('int16') || normalized.includes('i16')) return 'int16'
  if (normalized.includes('int8') || normalized.includes('i8')) return 'int8'
  if (normalized.includes('uint8') || normalized.includes('u8')) return 'uint8'
  
  return normalized
}

/**
 * Validate parsed tensor against expected shape and dtype
 */
export function validateTensor(
  parsed: ParsedTensor,
  expectedShape?: number[],
  expectedDtype?: string
): { valid: boolean; error?: string } {
  if (expectedShape) {
    const shapeMatch = JSON.stringify(parsed.shape) === JSON.stringify(expectedShape)
    if (!shapeMatch) {
      return {
        valid: false,
        error: `Shape mismatch: expected ${JSON.stringify(expectedShape)}, got ${JSON.stringify(parsed.shape)}`,
      }
    }
  }
  
  if (expectedDtype) {
    const dtypeMatch = normalizeDtype(parsed.dtype) === normalizeDtype(expectedDtype)
    if (!dtypeMatch) {
      return {
        valid: false,
        error: `Dtype mismatch: expected ${expectedDtype}, got ${parsed.dtype}`,
      }
    }
  }
  
  // Validate data length matches shape
  const expectedLength = parsed.shape.reduce((acc, dim) => acc * dim, 1)
  if (parsed.data.length !== expectedLength) {
    return {
      valid: false,
      error: `Data length mismatch: expected ${expectedLength} elements, got ${parsed.data.length}`,
    }
  }
  
  return { valid: true }
}

