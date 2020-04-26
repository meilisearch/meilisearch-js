// Type definitions for meilisearch 0.10.0
// Project: https://github.com/meilisearch/meilisearch-js
// Definitions by: qdequele <quentin@meilisearch.com> <https://github.com/meilisearch>
// Definitions: https://github.com/meilisearch/meilisearch-js
// TypeScript Version: ^3.8.3

import {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from 'axios'

import { Index } from './index'
import MeiliAxiosWrapper from './meili-axios-wrapper'
import MeiliSearch from './meilisearch'
import MeiliSearchApiError from './custom-errors/meilisearch-error'
import MeiliSearchTimeOutError from './custom-errors/meilisearch-timeout-error'
export { Index }
export { MeiliSearchApiError }
export { MeiliSearchTimeOutError }

export interface Config {
  host: string
  apiKey?: string
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
  name?: string
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
  attributesToRetrieve?: string[] | string
  attributesToCrop?: string[] | string
  cropLength?: number
  attributesToHighlight?: string[] | string
  filters?: string
  matches?: boolean
}

export interface SearchRequest {
  q: string
  offset?: number
  limit?: number
  attributesToRetrieve?: string
  attributesToCrop?: string
  cropLength?: number
  attributesToHighlight?: string
  filters?: string
  matches?: boolean
}

export type Hit<T> = T & { _formatted?: T }

export interface SearchResponse<T = any> {
  hits: Array<Hit<T>>
  offset: number
  limit: number
  processingTimeMs: number
  query: string
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
  rankingRules?: string[]
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

/*
 ** MeiliSearch Class Interfaces
 */

export interface MeiliSearchInterface extends MeiliAxiosWrapper {
  config: Config
  getIndex(indexUid: string): Index
  listIndexes(): Promise<IndexResponse[]>
  createIndex(data: IndexRequest): Promise<Index>
  getKeys(): Promise<Keys>
  isHealthy(): Promise<boolean>
  setHealthy(): Promise<void>
  setUnhealthy(): Promise<void>
  changeHealthTo(health: boolean): Promise<void>
  stats(): Promise<Stats>
  version(): Promise<Version>
  sysInfo(): Promise<SysInfo>
  prettySysInfo(): Promise<SysInfoPretty>
}

export interface IndexInterface extends MeiliAxiosWrapperInterface {
  uid: string
  getUpdateStatus(updateId: number): Promise<Update>
  getAllUpdateStatus(): Promise<Update[]>
  search(query: string, options?: SearchParams): Promise<SearchResponse>
  show(): Promise<IndexResponse>
  updateIndex(data: UpdateIndexRequest): Promise<IndexResponse>
  deleteIndex(): Promise<string>
  getStats(): Promise<IndexStats>
  getDocuments(options?: GetDocumentsParams): Promise<Document[]>
  getDocument(documentId: string | number): Promise<Document>
  addDocuments(
    documents: Document[],
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate>
  updateDocuments(
    documents: Document[],
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate>
  deleteDocument(documentId: string | number): Promise<EnqueuedUpdate>
  deleteDocuments(documentsIds: string[] | number[]): Promise<EnqueuedUpdate>
  deleteAllDocuments(): Promise<EnqueuedUpdate>
  getSettings(): Promise<Settings>
  updateSettings(settings: Settings): Promise<EnqueuedUpdate>
  resetSettings(): Promise<EnqueuedUpdate>
  getSynonyms(): Promise<object>
  updateSynonyms(synonyms: object): Promise<object>
  resetSynonyms(): Promise<object>
  getStopWords(): Promise<string[]>
  updateStopWords(stopWords: string[]): Promise<EnqueuedUpdate>
  resetStopWords(): Promise<EnqueuedUpdate>
  getRankingRules(): Promise<string[]>
  updateRankingRules(rankingRules: string[]): Promise<EnqueuedUpdate>
  resetRankingRules(): Promise<EnqueuedUpdate>
  getDistinctAttribute(): Promise<string | void>
  updateDistinctAttribute(distinctAttribute: string): Promise<EnqueuedUpdate>
  resetDistinctAttribute(): Promise<EnqueuedUpdate>
  getSearchableAttributes(): Promise<string[]>
  updateSearchableAttributes(
    searchableAttributes: string[]
  ): Promise<EnqueuedUpdate>
  resetSearchableAttributes(): Promise<EnqueuedUpdate>
  getDisplayedAttributes(): Promise<string[]>
  updateDisplayedAttributes(
    displayedAttributes: string[]
  ): Promise<EnqueuedUpdate>
  resetDisplayedAttributes(): Promise<EnqueuedUpdate>
  getAcceptNewFields(): Promise<boolean>
  updateAcceptNewFields(acceptNewFields: boolean): Promise<EnqueuedUpdate>
}

export interface MeiliAxiosWrapperInterface {
  instance: AxiosInstance
  cancelTokenSource: CancelTokenSource
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R>
  post(
    url: string,
    data: IndexRequest,
    config?: AxiosRequestConfig
  ): Promise<IndexResponse>
  post<T = any, R = AxiosResponse<EnqueuedUpdate>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R>
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R>
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R>
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R>
}

/*
 ** ERROR HANDLER
 */

export interface MeiliSearchApiErrorInterface extends Error {
  name: string
  message: string
  stack?: string
}
export interface MeiliSearchApiErrorResponse {
  status?: number
  statusText?: string
  path?: string
  method?: string
  body?: object
}
export interface MeiliSearchApiErrorRequest {
  url?: string
  path?: string
  method?: string
}

export type MeiliSearchApiErrorConstructor = new (
  error: AxiosError,
  cachedStack?: string
) => void

export default MeiliSearch
