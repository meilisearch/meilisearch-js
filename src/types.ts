///
/// Global interfaces
///

export interface Index {
  name: string
  identifier?: string
  uid: string
  createdAt: Date
  updatedAt: Date
}

export interface AsyncUpdateId {
  updateId: number
}

export interface Settings {
  rankingOrder?: string[]
  distinctField?: string
  rankingRules?: {
    [field: string]: string
  }
}

///
/// Request specific interfaces
///

export interface CreateIndexRequest {
  uid: string
  identifier?: string
}

export interface CreateIndexResponse {
  uid: string
  identifier?: string
  updateId?: number
  createdAt: Date
  updatedAt: Date
}

export interface UpdateIndexRequest {
  identifier?: string
}

export interface GetDocumentsParams {
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
}

export interface addDocumentParams {
  identifier?: string
}

export interface SearchParams {
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
  attributesToSearchIn?: string[]
  attributesToCrop?: string[]
  cropLength?: number
  attributesToHighlight?: string[]
  filters?: string
  timeoutMs?: number
  matches?: boolean
}

export interface SearchRequest {
  q: string
  offset?: number
  limit?: number
  attributesToRetrieve?: string
  attributesToSearchIn?: string
  attributesToCrop?: string
  cropLength?: number
  attributesToHighlight?: string
  filters?: string
  timeoutMs?: number
  matches?: boolean
}

export interface SearchResponse {
  hits: any[]
  offset: number
  limit: number
  processingTimeMs: number
  query: string
  // _formatted?: SearchResponse
  // _matchesInfo?: Object
}
