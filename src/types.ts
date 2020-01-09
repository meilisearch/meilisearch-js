///
/// Global interfaces
///

export interface SchemaRaw {
  identifier: string
  attributes: {
    [field: string]: {
      displayed?: boolean
      indexed?: boolean
      ranked?: boolean
    }
  }
}

export interface Schema {
  [field: string]: string[]
}

export interface Index {
  name: string
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
  name: string
  uid?: string
  schema?: Schema
}

export interface CreateIndexResponse {
  name: string
  uid: string
  schema?: Schema
  updateId?: number
  createdAt: Date
  updatedAt: Date
}

export interface UpdateIndexRequest {
  name: string
}

export interface GetDocumentsParams{
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
}


export interface PostDocumentParams{

}

export interface SearchParams {
  q: string
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

