///
/// Global interfaces
///

export interface Index {
  name?: string
  primaryKey?: string
  uid: string
  createdAt: Date
  updatedAt: Date
}

export interface AsyncUpdateId {
  updateId: number
}

///
/// Request specific interfaces
///

export interface IndexRequest {
  uid: string
  primaryKey?: string
}

export interface IndexResponse {
  uid: string
  primaryKey?: string
  createdAt: Date
  updatedAt: Date
}

export interface UpdateIndexRequest {
  primaryKey?: string
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

export type Hit<T> = T & { _formatted?: T }

export interface SearchResponse<T = any> {
  hits: Hit<T>[]
  offset: number
  limit: number
  processingTimeMs: number
  query: string
}

export interface Config {
  host: string
  apiKey?: string
}

export interface FieldFrequency {
  [field: string]: number
}

/*
 ** Documents
 */
export interface GetDocumentsParams {
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
}

export interface Document<T = any> {
  [attribute: string]: T
}

/*
 ** Settings
 */
export interface Settings {
  distinctAttribute?: string
  searchableAttributes?: string[]
  displayedAttributes?: string[]
  rankingRules?: {
    [field: string]: string
  }
  stopWords?: string[]
  synonyms?: {
    [field: string]: string[]
  }
  indexNewFields?: boolean
}

/*
 ** UPDATE
 */

export interface EnqueuedUpdate {
  updateId: number
}

export interface Update {
  status: string
  updateId: number
  type: {
    name: string
    number: number
  }
  duration: number
  enqueuedAt: string
  processedAt: string
}

/*
 *** STATS
 */

export interface IndexStats {
  numberOfDocuments: number
  isIndexing: boolean
  fieldsFrequency: FieldFrequency
}

export interface Stats {
  databaseSize: number
  lastUpdate: string
  indexes: {
    [index: string]: IndexStats
  }
}

/*
 ** Keys
 */

export interface Keys {
  private: string | null
  public: string | null
}

/*
 ** version
 */
export interface Version {
  commitSha: string
  buildDate: string
  pkgVersion: string
}

/*
 ** SYS-INFO
 */
export interface SysInfo {
  memoryUsage: number
  processorUsage: number[]
  global: {
    totalMemory: number
    usedMemory: number
    totalSwap: number
    usedSwap: number
    inputData: number
    outputData: number
  }
  process: {
    memory: number
    cpu: number
  }
}

export interface SysInfoPretty {
  memoryUsage: string
  processorUsage: string[]
  global: {
    totalMemory: string
    usedMemory: string
    totalSwap: string
    usedSwap: string
    inputData: string
    outputData: string
  }
  process: {
    memory: string
    cpu: string
  }
}
