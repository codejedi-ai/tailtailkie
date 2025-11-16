import { MilvusClient } from '@zilliz/milvus2-sdk-node'

// Helper function to check if Milvus is configured
export function isMilvusConfigured(): boolean {
  return !!(process.env.MILVUS_URI || process.env.MILVUS_HOST) && !!process.env.MILVUS_TOKEN
}

// Get Milvus configuration (only if configured)
function getMilvusConfig() {
  const MILVUS_URI = process.env.MILVUS_URI || process.env.MILVUS_HOST
  const MILVUS_TOKEN = process.env.MILVUS_TOKEN
  const MILVUS_USER = process.env.MILVUS_USER

  if (!MILVUS_URI || !MILVUS_TOKEN) {
    return null
  }

  const milvusConfig: any = {
    address: MILVUS_URI,
    token: MILVUS_TOKEN,
  }

  // Add user if provided
  if (MILVUS_USER) {
    milvusConfig.username = MILVUS_USER
  }

  return milvusConfig
}

let milvusClient: MilvusClient | null = null
let milvusClientPromise: Promise<MilvusClient> | null = null

// Initialize Milvus client
export async function getMilvusClient(): Promise<MilvusClient> {
  if (!isMilvusConfigured()) {
    throw new Error('Milvus is not configured. Please set MILVUS_URI and MILVUS_TOKEN environment variables.')
  }

  if (milvusClient) {
    return milvusClient
  }

  const milvusConfig = getMilvusConfig()
  if (!milvusConfig) {
    throw new Error('Milvus configuration is invalid')
  }

  if (!milvusClientPromise) {
    if (process.env.NODE_ENV === 'development') {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      let globalWithMilvus = global as typeof globalThis & {
        _milvusClient?: MilvusClient
      }

      if (!globalWithMilvus._milvusClient) {
        milvusClient = new MilvusClient(milvusConfig)
        globalWithMilvus._milvusClient = milvusClient
      }
      milvusClient = globalWithMilvus._milvusClient
      milvusClientPromise = Promise.resolve(milvusClient)
    } else {
      // In production mode, it's best to not use a global variable.
      milvusClient = new MilvusClient(milvusConfig)
      milvusClientPromise = Promise.resolve(milvusClient)
    }
  }

  return milvusClientPromise
}

// Export default for convenience
export default getMilvusClient

// Helper function to get collection name for a dataset
// Each dataset gets its own Milvus collection
export function getCollectionName(datasetId: string): string {
  return `dataset_${datasetId.replace(/[^a-zA-Z0-9]/g, '_')}`
}

// Helper function to calculate vector dimension from tensor shape
// Flattens all dimensions except the first (batch) dimension
// Example: (N, 12, 8, 8) -> vector dimension = 12 * 8 * 8 = 768
export function calculateVectorDimension(shape: number[]): number {
  if (shape.length < 2) {
    throw new Error('Tensor must have at least 2 dimensions (batch dimension + feature dimensions)')
  }
  // Skip first dimension (batch size) and multiply the rest
  return shape.slice(1).reduce((acc, dim) => acc * dim, 1)
}

// Helper function to flatten tensor data into vectors
// Takes a tensor with shape (N, ...) and returns N vectors
export function flattenTensorToVectors(tensorData: number[], shape: number[]): number[][] {
  const batchSize = shape[0]
  const vectorDim = calculateVectorDimension(shape)
  const vectors: number[][] = []

  for (let i = 0; i < batchSize; i++) {
    const startIdx = i * vectorDim
    const endIdx = startIdx + vectorDim
    vectors.push(tensorData.slice(startIdx, endIdx))
  }

  return vectors
}

