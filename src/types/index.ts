export interface SavedConnection {
  id: string
  name: string
  encryptedUri: string  // AES-256 encrypted
  createdAt: string
  lastUsed?: string
}

export interface ActiveConnection {
  id: string
  name: string
  uri: string
}

export interface DatabaseInfo {
  name: string
  sizeOnDisk?: number
  empty?: boolean
}

export interface CollectionInfo {
  name: string
  type: string
  count?: number
}

export interface DocumentResult {
  documents: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface QueryParams {
  filter: string
  sort: string
  limit: number
  skip: number
  projection: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}