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

export type Result<T> = {
  results: T
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

/*
 * SEARCH PARAMETERS
 */

export type Filter = string | Array<string | string[]>

export type Pagination = {
  offset?: number
  limit?: number
}

export type Query = {
  q?: string | null
}

export type Highlight = {
  attributesToHighlight?: string[]
  highlightPreTag?: string
  highlightPostTag?: string
}

export type Crop = {
  attributesToCrop?: string[]
  cropLength?: number
  cropMarker?: string
}

export type SearchParams = Pagination &
  Highlight &
  Crop & {
    filter?: Filter
    sort?: string[]
    facetsDistribution?: string[]
    attributesToRetrieve?: string[]
    matches?: boolean
  }

export type SearchRequest = SearchParams & Query

// Search parameters for searches made with the GET method
// Are different than the parameters for the POST method
export type SearchRequestGET = Pagination &
  Query &
  Omit<Highlight, 'attributesToHighlight'> &
  Omit<Crop, 'attributesToCrop'> & {
    filter?: string
    sort?: string
    facetsDistribution?: string
    attributesToRetrieve?: string
    attributesToHighlight?: string
    attributesToCrop?: string
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
export type TypoTolerance = {
  enabled?: boolean | null
  disabledOnAttributes?: string[] | null
  disableOnWords?: string[] | null
  minWordSizeForTypos?: {
    oneTypo?: number | null
    twoTypos?: number | null
  }
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
  typoTolerance?: TypoTolerance
}

/*
 ** TASKS
 */

export const enum TaskStatus {
  TASK_SUCCEEDED = 'succeeded',
  TASK_PROCESSING = 'processing',
  TASK_FAILED = 'failed',
  TASK_ENQUEUED = 'enqueued',
}

export type EnqueuedTask = {
  uid: number
  indexUid: string
  status: TaskStatus
  type: string
  enqueuedTask: string
}

export type Task = {
  status: TaskStatus
  uid: number
  type: string
  details: {
    // Number of documents sent
    receivedDocuments?: number

    // Number of documents successfully indexed/updated in Meilisearch
    indexedDocuments?: number

    // Number of deleted documents
    deletedDocuments?: number

    // Primary key on index creation
    primaryKey?: string

    // Ranking rules on settings actions
    rankingRules: RankingRules

    // Searchable attributes on settings actions
    searchableAttributes: SearchableAttributes

    // Displayed attributes on settings actions
    displayedAttributes: DisplayedAttributes

    // Filterable attributes on settings actions
    filterableAttributes: FilterableAttributes

    // Sortable attributes on settings actions
    sortableAttributes: SortableAttributes

    // Stop words on settings actions
    stopWords: StopWords

    // Stop words on settings actions
    synonyms: Synonyms

    // Distinct attribute on settings actions
    distinctAttribute: DistinctAttribute
  }
  duration: string
  enqueuedAt: string
  processedAt: string
  error?: MeiliSearchErrorBody
}

export type EnqueuedDump = {
  uid: string
  status: 'in_progress' | 'failed' | 'done'
  startedAt: string
  finishedAt: string
}

export type WaitOptions = {
  timeOutMs?: number
  intervalMs?: number
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

export type Key = {
  description: string
  key: string
  actions: string[]
  indexes: string[]
  expiresAt: string
  createdAt: string
  updateAt: string
}

export type KeyPayload = {
  description?: string
  actions: string[]
  indexes: string[]
  expiresAt: string | null
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

export interface MeiliSearchErrorInterface extends Error {
  code?: string
  link?: string
  stack?: string
  type?: string
}

export interface FetchError extends Error {
  type: string
  errno: string
  code: string
}

export type MeiliSearchErrorBody = {
  code: string
  link: string
  message: string
  type: string
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

  /** @see https://docs.meilisearch.com/errors/#primary_key_inference_failed */
  PRIMARY_KEY_INFERENCE_FAILED = 'primary_key_inference_failed',

  /** @see https://docs.meilisearch.com/errors/#index_primary_key_already_exists */
  INDEX_PRIMARY_KEY_ALREADY_EXISTS = 'index_primary_key_already_exists',

  /** @see https://docs.meilisearch.com/errors/#max_fields_limit_exceeded */
  DOCUMENTS_FIELDS_LIMIT_REACHED = 'document_fields_limit_reached',

  /** @see https://docs.meilisearch.com/errors/#missing_document_id */
  MISSING_DOCUMENT_ID = 'missing_document_id',

  /** @see https://docs.meilisearch.com/errors/#missing_document_id */
  INVALID_DOCUMENT_ID = 'invalid_document_id',

  /** @see https://docs.meilisearch.com/errors/#invalid_content_type */
  INVALID_CONTENT_TYPE = 'invalid_content_type',

  /** @see https://docs.meilisearch.com/errors/#missing_content_type */
  MISSING_CONTENT_TYPE = 'missing_content_type',

  /** @see https://docs.meilisearch.com/errors/#payload_too_large */
  PAYLOAD_TOO_LARGE = 'payload_too_large',

  /** @see https://docs.meilisearch.com/errors/#missing_payload */
  MISSING_PAYLOAD = 'missing_payload',

  /** @see https://docs.meilisearch.com/errors/#malformed_payload */
  MALFORMED_PAYLOAD = 'malformed_payload',

  /** @see https://docs.meilisearch.com/errors/#no_space_left_on_device */
  NO_SPACE_LEFT_ON_DEVICE = 'no_space_left_on_device',

  /** @see https://docs.meilisearch.com/errors/#invalid_store_file */
  INVALID_STORE_FILE = 'invalid_store_file',

  /** @see https://docs.meilisearch.com/errors/#invalid_ranking_rules */
  INVALID_RANKING_RULES = 'missing_document_id',

  /** @see https://docs.meilisearch.com/errors/#invalid_request */
  INVALID_REQUEST = 'invalid_request',

  /** @see https://docs.meilisearch.com/errors/#invalid_filter */
  INVALID_FILTER = 'invalid_filter',

  /** @see https://docs.meilisearch.com/errors/#invalid_sort */
  INVALID_SORT = 'invalid_sort',

  /** @see https://docs.meilisearch.com/errors/#invalid_geo_field */
  INVALID_GEO_FIELD = 'invalid_geo_field',

  /** @see https://docs.meilisearch.com/errors/#bad_request */
  BAD_REQUEST = 'bad_request',

  /** @see https://docs.meilisearch.com/errors/#document_not_found */
  DOCUMENT_NOT_FOUND = 'document_not_found',

  /** @see https://docs.meilisearch.com/errors/#internal */
  INTERNAL = 'internal',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key */
  INVALID_API_KEY = 'invalid_api_key',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_description */
  INVALID_API_KEY_DESCRIPTION = 'invalid_api_key_description',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_actions */
  INVALID_API_KEY_ACTIONS = 'invalid_api_key_actions',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_indexes */
  INVALID_API_KEY_INDEXES = 'invalid_api_key_indexes',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_expires_at */
  INVALID_API_KEY_EXPIRES_AT = 'invalid_api_key_expires_at',

  /** @see https://docs.meilisearch.com/errors/#api_key_not_found */
  API_KEY_NOT_FOUND = 'api_key_not_found',

  /** @see https://docs.meilisearch.com/errors/#missing_parameter */
  MISSING_PARAMETER = 'missing_parameter',

  /** @see https://docs.meilisearch.com/errors/#missing_authorization_header */
  MISSING_AUTHORIZATION_HEADER = 'missing_authorization_header',

  /** @see https://docs.meilisearch.com/errors/#unretrievable_document */
  UNRETRIEVABLE_DOCUMENT = 'unretrievable_document',

  /** @see https://docs.meilisearch.com/errors/#database_size_limit_reached */
  MAX_DATABASE_SIZE_LIMIT_REACHED = 'database_size_limit_reached',

  /** @see https://docs.meilisearch.com/errors/#task_not_found */
  TASK_NOT_FOUND = 'task_not_found',

  /** @see https://docs.meilisearch.com/errors/#dump_already_processing */
  DUMP_ALREADY_PROCESSING = 'dump_already_processing',

  /** @see https://docs.meilisearch.com/errors/#dump_process_failed */
  DUMP_PROCESS_FAILED = 'dump_process_failed',

  /** @see https://docs.meilisearch.com/errors/#dump_not_found */
  DUMP_NOT_FOUND = 'dump_not_found',
}

export type TokenIndexRules = {
  [field: string]: any
  filter?: Filter
}
export type TokenSearchRules = Record<string, TokenIndexRules | null> | string[]

export type TokenOptions = {
  apiKey?: string
  expiresAt?: Date
}
