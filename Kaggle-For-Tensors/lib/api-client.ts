/**
 * API Client for Flask backend
 * This replaces direct database connections with API calls to the Flask backend
 */

const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000/service/api'

/**
 * Get the authorization token from Clerk
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // In Next.js, we can use the auth() function from Clerk
    // For client-side calls, we need to get the token from the session
    const response = await fetch('/api/auth/token')
    if (response.ok) {
      const data = await response.json()
      return data.token
    }
  } catch (error) {
    console.error('Error getting auth token:', error)
  }
  return null
}

/**
 * Make an authenticated API request to Flask backend
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const url = `${FLASK_API_URL}${endpoint}`
  
  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * API client methods
 */
export const apiClient = {
  /**
   * Get datasets with optional filters
   */
  async getDatasets(params?: {
    search?: string
    userId?: string
    format?: string
    limit?: number
    offset?: number
  }): Promise<{ datasets: any[]; total: number; limit: number; offset: number }> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.format) queryParams.append('format', params.format)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const response = await apiRequest(`/datasets?${queryParams.toString()}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch datasets: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Get a single dataset by ID
   */
  async getDataset(id: string): Promise<any> {
    const response = await apiRequest(`/datasets/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Create a new dataset
   */
  async createDataset(data: any): Promise<any> {
    const response = await apiRequest('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.message || `Failed to create dataset: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Upload files
   */
  async uploadFiles(files: File[]): Promise<{ files: any[] }> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const token = await getAuthToken()
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${FLASK_API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.message || `Failed to upload files: ${response.statusText}`)
    }
    return response.json()
  },
}

