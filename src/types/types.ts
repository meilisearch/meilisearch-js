// Type definitions for meilisearch
// Project: https://github.com/meilisearch/meilisearch-js
// Definitions by: qdequele <quentin@meilisearch.com> <https://github.com/meilisearch>
// Definitions: https://github.com/meilisearch/meilisearch-js
// TypeScript Version: ^3.8.3

export type Config = {
  host: string
  apiKey?: string
  headers?: object
}

///
/// Request specific interfaces
///

export type IndexRequest = {
  uid: string
  primaryKey?: string
}

export type IndexOptions = {
  primaryKey?: string
}

export type IndexResponse = {
  uid: string
  name?: string
  primaryKey?: string
  createdAt: Date
  updatedAt: Date
}

export type AddDocumentParams = {
  primaryKey?: string
}

export type Filter = string | Array<string | string[]>

export type SearchParams = {
  offset?: number
  limit?: number
  attributesToRetrieve?: string[]
  attributesToCrop?: string[]
  cropLength?: number
  attributesToHighlight?: string[]
  filter?: Filter
  sort?: string[]
  facetsDistribution?: string[]
  matches?: boolean
}

export type SearchRequestGET = {
  q?: string | null
  offset?: number
  limit?: number
  attributesToRetrieve?: string
  attributesToCrop?: string
  cropLength?: number
  attributesToHighlight?: string
  facetsDistribution?: string
  filter?: string
  sort?: string
  matches?: boolean
}

export type SearchRequest = {
  q?: string | null
  offset?: number
  limit?: number
  cropLength?: number
  attributesToRetrieve?: string[]
  attributesToCrop?: string[]
  attributesToHighlight?: string[]
  facetsDistribution?: string[]
  filter?: Filter
  sort?: string[]
  matches?: boolean
}

export type CategoriesDistribution = {
  [category: string]: number
}

export type Facet = string
export type FacetsDistribution = Record<Facet, CategoriesDistribution>
export type _matchesInfo<T> = Partial<
  Record<keyof T, Array<{ start: number; length: number }>>
>

export type document = {
  [field: string]: any
}

export type Hit<T = document> = T & {
  _formatted?: Partial<T>
  _matchesInfo?: _matchesInfo<T>
}

export type Hits<T = document> = Array<Hit<T>>

export type SearchResponse<T = Record<string, any>> = {
  hits: Hits<T>
  offset: number
  limit: number
  processingTimeMs: number
  facetsDistribution?: FacetsDistribution
  exhaustiveFacetsCount?: boolean
  query: string
  nbHits: number
  exhaustiveNbHits: boolean
}

export type FieldDistribution = {
  [field: string]: number
}

/*
 ** Documents
 */
export type GetDocumentsParams<T = Record<string, any>> = {
  offset?: number
  limit?: number
  attributesToRetrieve?:
    | Array<Extract<keyof T, string>>
    | Extract<keyof T, string>
}

export type GetDocumentsResponse<T = Record<string, any>> = Array<Document<T>>

export type Document<T = Record<string, any>> = T

/*
 ** Settings
 */

export type FilterableAttributes = string[] | null
export type DistinctAttribute = string | null
export type SearchableAttributes = string[] | null
export type SortableAttributes = string[] | null
export type DisplayedAttributes = string[] | null
export type RankingRules = string[] | null
export type StopWords = string[] | null
export type Synonyms = {
  [field: string]: string[]
} | null

export type Settings = {
  filterableAttributes?: FilterableAttributes
  distinctAttribute?: DistinctAttribute
  sortableAttributes?: SortableAttributes
  searchableAttributes?: SearchableAttributes
  displayedAttributes?: DisplayedAttributes
  rankingRules?: RankingRules
  stopWords?: StopWords
  synonyms?: Synonyms
}

/*
 ** UPDATE
 */

export type EnqueuedUpdate = {
  updateId: number
}

export type Update = {
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

export type EnqueuedDump = {
  uid: string
  status: 'in_progress' | 'failed' | 'done'
  startedAt: string
  finishedAt: string
}

/*
 *** HEALTH
 */

export type Health = {
  status: 'available'
}

/*
 *** STATS
 */

export type IndexStats = {
  numberOfDocuments: number
  isIndexing: boolean
  fieldDistribution: FieldDistribution
}

export type Stats = {
  databaseSize: number
  lastUpdate: string
  indexes: {
    [index: string]: IndexStats
  }
}

/*
 ** Keys
 */

export type Keys = {
  private: string | null
  public: string | null
}

/*
 ** version
 */
export type Version = {
  commitSha: string
  commitDate: string
  pkgVersion: string
}

/*
 ** ERROR HANDLER
 */

export type MSApiErrorConstructor = new (
  error: MSApiError,
  status: number
) => void

export type MeiliSearchApiErrorResponse = {
  status?: number
  statusText?: string
  path?: string
  method?: string
  body?: object
}
export type MeiliSearchApiErrorRequest = {
  url?: string
  path?: string
  method?: string
}

export interface FetchError extends Error {
  type: string
  errno: string
  code: string
}

export interface MSApiError extends Error {
  name: string
  message: string
  stack?: string
  httpStatus: number
  errorCode?: string
  errorType?: string
  errorLink?: string
}

export const enum ErrorStatusCode {
  /** @see https://docs.meilisearch.com/errors/#index_creation_failed */
  INDEX_CREATION_FAILED = 'index_creation_failed',

  /** @see https://docs.meilisearch.com/errors/#index_already_exists */
  INDEX_ALREADY_EXISTS = 'index_already_exists',

  /** @see https://docs.meilisearch.com/errors/#index_not_found */
  INDEX_NOT_FOUND = 'index_not_found',

  /** @see https://docs.meilisearch.com/errors/#invalid_index_uid */
  INVALID_INDEX_UID = 'invalid_index_uid',

  /** @see https://docs.meilisearch.com/errors/#index_not_accessible */
  INDEX_NOT_ACCESSIBLE = 'index_not_accessible',

  /** @see https://docs.meilisearch.com/errors/#invalid_state */
  INVALID_STATE = 'invalid_state',

  /** @see https://docs.meilisearch.com/errors/#missing_primary_key */
  MISSING_PRIMARY_KEY = 'missing_primary_key',

  /** @see https://docs.meilisearch.com/errors/#primary_key_already_present */
  PRIMARY_KEY_ALREADY_PRESENT = 'primary_key_already_present',

  /** @see https://docs.meilisearch.com/errors/#max_fields_limit_exceeded */
  MAX_FIELDS_LIMIT_EXCEEDED = 'max_fields_limit_exceeded',

  /** @see https://docs.meilisearch.com/errors/#missing_document_id */
  MISSING_DOCUMENT_ID = 'missing_document_id',

  /** @see https://docs.meilisearch.com/errors/#invalid_facet */
  INVALID_FACET = 'invalid_facet',

  /** @see https://docs.meilisearch.com/errors/#invalid_filter */
  INVALID_FILTER = 'invalid_filter',

  /** @see https://docs.meilisearch.com/errors/#bad_parameter */
  BAD_PARAMETER = 'bad_parameter',

  /** @see https://docs.meilisearch.com/errors/#bad_request */
  BAD_REQUEST = 'bad_request',

  /** @see https://docs.meilisearch.com/errors/#document_not_found */
  DOCUMENT_NOT_FOUND = 'document_not_found',

  /** @see https://docs.meilisearch.com/errors/#internal */
  INTERNAL = 'internal',

  /** @see https://docs.meilisearch.com/errors/#invalid_token */
  INVALID_TOKEN = 'invalid_token',

  /** @see https://docs.meilisearch.com/errors/#maintenance */
  MAINTENANCE = 'maintenance',

  /** @see https://docs.meilisearch.com/errors/#missing_authorization_header */
  MISSING_AUTHORIZATION_HEADER = 'missing_authorization_header',

  /** @see https://docs.meilisearch.com/errors/#missing_header */
  MISSING_HEADER = 'missing_header',

  /** @see https://docs.meilisearch.com/errors/#not_found */
  NOT_FOUND = 'not_found',

  /** @see https://docs.meilisearch.com/errors/#payload_too_large */
  PAYLOAD_TOO_LARGE = 'payload_too_large',

  /** @see https://docs.meilisearch.com/errors/#unretrievable_document */
  UNRETRIEVABLE_DOCUMENT = 'unretrievable_document',

  /** @see https://docs.meilisearch.com/errors/#search_error */
  SEARCH_ERROR = 'search_error',

  /** @see https://docs.meilisearch.com/errors/#unsupported_media_type */
  UNSUPPORTED_MEDIA_TYPE = 'unsupported_media_type',

  /** @see https://docs.meilisearch.com/errors/#dump_already_in_progress */
  DUMP_ALREADY_IN_PROGRESS = 'dump_already_in_progress',

  /** @see https://docs.meilisearch.com/errors/#dump_process_failed */
  DUMP_PROCESS_FAILED = 'dump_process_failed',
}
