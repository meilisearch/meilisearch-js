///
/// Global interfaces
///

export interface Index {
  name: string
  primaryKey?: string
  uid: string
  createdAt: Date
  updatedAt: Date
}

export interface AsyncUpdateId {
  updateId: number
}

export interface Settings {
  rankingDistinct?: string
  searchableAttributes?: string[]
  displayedAttributes?: string[]
  distinctField?: string
  rankingRules?: {
    [field: string]: string
  }
  stopWords?: string[]
  synonyms?: {
    [field: string]: string[]
  }
  indexNewFields?: boolean
}

///
/// Request specific interfaces
///

export interface CreateIndexRequest {
  uid: string
  primaryKey?: string
}

export interface CreateIndexResponse {
  uid: string
  primaryKey?: string
  updateId?: number
  createdAt: Date
  updatedAt: Date
}

export interface UpdateIndexRequest {
  primaryKey?: string
}

export interface GetDocumentsParams {
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
}

export interface AddDocumentParams {
  primaryKey?: string
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
  hits: object[]
  offset: number
  limit: number
  processingTimeMs: number
  query: string
}
