/*
 * Bundle: Meilisearch / Indexes
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

import { MeilisearchError } from "./errors/index.js";
import type {
  Config,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexObject,
  IndexOptions,
  IndexStats,
  StatsQuery,
  DocumentsQuery,
  DocumentQuery,
  DocumentOptions,
  Settings,
  Synonyms,
  StopWords,
  RankingRules,
  DistinctAttribute,
  FilterableAttributes,
  SortableAttributes,
  SearchableAttributes,
  DisplayedAttributes,
  TypoTolerance,
  PaginationSettings,
  Faceting,
  ResourceResults,
  RawDocumentAdditionOptions,
  ContentType,
  DocumentsIds,
  DocumentsDeletionQuery,
  SearchForFacetValuesParams,
  SearchForFacetValuesResponse,
  SeparatorTokens,
  NonSeparatorTokens,
  Dictionary,
  ProximityPrecision,
  Embedders,
  SearchCutoffMs,
  SearchSimilarDocumentsParams,
  LocalizedAttributes,
  ForeignKey,
  ForeignKeys,
  UpdateDocumentsByFunctionOptions,
  TaskEnqueueOptions,
  ExtraRequestInit,
  PrefixSearch,
  RecordAny,
  EnqueuedTaskPromise,
  ChatSettings,
  ChatSettingsPayload,
  FieldsQuery,
  FieldsResults,
} from "./types/index.js";
import { HttpRequests } from "./http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
  type HttpRequestsWithEnqueuedTaskPromise,
} from "./task.js";

export class Index<T extends RecordAny = RecordAny> {
  uid: string;
  primaryKey: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  httpRequest: HttpRequests;
  tasks: TaskClient;
  readonly #httpRequestsWithTask: HttpRequestsWithEnqueuedTaskPromise;

  /**
   * @param config - Request configuration options
   * @param uid - UID of the index
   * @param primaryKey - Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid;
    this.primaryKey = primaryKey;
    this.httpRequest = new HttpRequests(config);
    this.tasks = new TaskClient(this.httpRequest, config.defaultWaitOptions);
    this.#httpRequestsWithTask = getHttpRequestsWithEnqueuedTaskPromise(
      this.httpRequest,
      this.tasks,
    );
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async search<D extends RecordAny = T, S extends SearchParams = SearchParams>(
    query?: string | null,
    options?: S,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchResponse<D, S>> {
    return await this.httpRequest.post<SearchResponse<D, S>>({
      path: `indexes/${this.uid}/search`,
      body: { q: query, ...options },
      extraRequestInit,
    });
  }

  /**
   * Search for documents into an index using the GET method
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async searchGet<
    D extends RecordAny = T,
    S extends SearchParams = SearchParams,
  >(
    query?: string | null,
    options?: S,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchResponse<D, S>> {
    // TODO: Make this a type thing instead of a runtime thing
    const parseFilter = (filter?: Filter): string | undefined => {
      if (typeof filter === "string") return filter;
      else if (Array.isArray(filter))
        throw new MeilisearchError(
          "The filter query parameter should be in string format when using searchGet",
        );
      else return undefined;
    };

    const getParams: SearchRequestGET = {
      q: query,
      ...options,
      filter: parseFilter(options?.filter),
      sort: options?.sort?.join(","),
      facets: options?.facets?.join(","),
      attributesToRetrieve: options?.attributesToRetrieve?.join(","),
      attributesToCrop: options?.attributesToCrop?.join(","),
      attributesToHighlight: options?.attributesToHighlight?.join(","),
      vector: options?.vector?.join(","),
      attributesToSearchOn: options?.attributesToSearchOn?.join(","),
    };

    return await this.httpRequest.get<SearchResponse<D, S>>({
      path: `indexes/${this.uid}/search`,
      params: getParams,
      extraRequestInit,
    });
  }

  /**
   * Search for facet values
   *
   * @param params - Parameters used to search on the facets
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async searchForFacetValues(
    params: SearchForFacetValuesParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchForFacetValuesResponse> {
    return await this.httpRequest.post<SearchForFacetValuesResponse>({
      path: `indexes/${this.uid}/facet-search`,
      body: params,
      extraRequestInit,
    });
  }

  /**
   * Search for similar documents
   *
   * @param params - Parameters used to search for similar documents
   * @returns Promise containing the search response
   */
  async searchSimilarDocuments<
    D extends RecordAny = T,
    S extends SearchParams = SearchParams,
  >(
    params: SearchSimilarDocumentsParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchResponse<D, S>> {
    return await this.httpRequest.post<SearchResponse<D, S>>({
      path: `indexes/${this.uid}/similar`,
      body: params,
      extraRequestInit,
    });
  }

  ///
  /// INDEX
  ///

  /**
   * Get index information.
   *
   * @returns Promise containing index information
   */
  async getRawInfo(extraRequestInit?: ExtraRequestInit): Promise<IndexObject> {
    const res = await this.httpRequest.get<IndexObject>({
      path: `indexes/${this.uid}`,
      extraRequestInit,
    });
    this.primaryKey = res.primaryKey;
    this.updatedAt = new Date(res.updatedAt);
    this.createdAt = new Date(res.createdAt);
    return res;
  }

  /**
   * Fetch and update Index information.
   *
   * @returns Promise to the current Index object with updated information
   */
  async fetchInfo(extraRequestInit?: ExtraRequestInit): Promise<this> {
    await this.getRawInfo(extraRequestInit);
    return this;
  }

  /**
   * Get Primary Key.
   *
   * @returns Promise containing the Primary Key of the index
   */
  async fetchPrimaryKey(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo(extraRequestInit)).primaryKey;
    return this.primaryKey;
  }

  /**
   * Create an index.
   *
   * @param uid - Unique identifier of the Index
   * @param options - Index options
   * @param config - Request configuration options
   * @returns Newly created Index object
   */
  static create(
    uid: string,
    options: IndexOptions = {},
    config: Config,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    const httpRequests = new HttpRequests(config);
    return getHttpRequestsWithEnqueuedTaskPromise(
      httpRequests,
      new TaskClient(httpRequests),
    ).post({
      path: "indexes",
      body: { ...options, uid },
      extraRequestInit,
    });
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  update(
    data?: IndexOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}`,
      body: data,
      extraRequestInit,
    });
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  delete(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}`,
      extraRequestInit,
    });
  }

  ///
  /// STATS
  ///

  /**
   * Get stats of an index
   *
   * Size fields are numbers of bytes by default. `sizeFormat: "human"` returns
   * them as strings with units, such as `"19.64 MiB"`.
   * `showInternalDatabaseSizes` adds each internal database's size.
   *
   * @typeParam Q - Stats query whose `sizeFormat` selects the size field type
   * @param params - Internal database sizes and size formatting
   * @returns Promise containing stats of the index
   * @see {@link https://www.meilisearch.com/docs/reference/api/indexes/get-stats-of-index}
   */
  async getStats<const Q extends StatsQuery | undefined = undefined>(
    params?: Q,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<IndexStats<Q>> {
    return await this.httpRequest.get<IndexStats<Q>>({
      path: `indexes/${this.uid}/stats`,
      params,
      extraRequestInit,
    });
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Get documents of an index.
   *
   * @param params - Parameters to browse the documents. Parameters can contain
   *   the `filter` field only available in Meilisearch v1.2 and newer, and the
   *   `sort` field available in Meilisearch v1.16 and newer
   * @returns Promise containing the returned documents
   */
  async getDocuments<D extends RecordAny = T>(
    params?: DocumentsQuery<D>,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ResourceResults<D[]>> {
    const relativeBaseURL = `indexes/${this.uid}/documents`;
    // Create a shallow copy so we can safely normalize parameters
    const normalizedParams = params ? { ...params } : undefined;
    // Omit empty sort arrays to avoid server-side validation errors
    if (
      normalizedParams &&
      Array.isArray(normalizedParams.sort) &&
      normalizedParams.sort.length === 0
    ) {
      delete (normalizedParams as { sort?: string[] }).sort;
    }

    return normalizedParams?.filter !== undefined
      ? // In case `filter` is provided, use `POST /documents/fetch`
        await this.httpRequest.post<ResourceResults<D[]>>({
          path: `${relativeBaseURL}/fetch`,
          body: normalizedParams,
          extraRequestInit,
        })
      : // Else use `GET /documents` method
        await this.httpRequest.get<ResourceResults<D[]>>({
          path: relativeBaseURL,
          params: normalizedParams,
          extraRequestInit,
        });
  }

  /**
   * Get one document
   *
   * @param documentId - Document ID
   * @param parameters - Parameters applied on a document
   * @returns Promise containing Document response
   */
  async getDocument<D extends RecordAny = T>(
    documentId: string | number,
    parameters?: DocumentQuery<T>,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<D> {
    const fields = Array.isArray(parameters?.fields)
      ? parameters.fields.join()
      : parameters?.fields;

    return await this.httpRequest.get<D>({
      path: `indexes/${this.uid}/documents/${documentId}`,
      params: { ...parameters, fields },
      extraRequestInit,
    });
  }

  /**
   * Add or replace multiples documents to an index
   *
   * @param documents - Array of Document objects to add/replace
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocuments(
    documents: T[],
    options?: DocumentOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
      extraRequestInit,
    });
  }

  /**
   * Add or replace multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/replace
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
      extraRequestInit,
    });
  }

  /**
   * Add or replace multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/replace
   * @param batchSize - Size of the batch
   * @param options - Options on document addition
   * @returns Promise containing array of enqueued task objects for each batch
   */
  addDocumentsInBatches(
    documents: T[],
    batchSize = 1000,
    options?: DocumentOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.addDocuments(
          documents.slice(i, i + batchSize),
          options,
          extraRequestInit,
        ),
      );
    }

    return updates;
  }

  /**
   * Add or update multiples documents to an index
   *
   * @param documents - Array of Document objects to add/update
   * @param options - Options on document update
   * @returns Promise containing an EnqueuedTask
   */
  updateDocuments(
    documents: Partial<T>[],
    options?: DocumentOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
      extraRequestInit,
    });
  }

  /**
   * Add or update multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/update
   * @param batchSize - Size of the batch
   * @param options - Options on document update
   * @returns Promise containing array of enqueued task objects for each batch
   */
  updateDocumentsInBatches(
    documents: Partial<T>[],
    batchSize = 1000,
    options?: DocumentOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.updateDocuments(
          documents.slice(i, i + batchSize),
          options,
          extraRequestInit,
        ),
      );
    }

    return updates;
  }

  /**
   * Add or update multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/update
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param queryParams - Options on raw document addition
   * @returns Promise containing an EnqueuedTask
   */
  updateDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
      extraRequestInit,
    });
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @param options - Task enqueue options (e.g. customMetadata)
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocument(
    documentId: string | number,
    options?: TaskEnqueueOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/documents/${documentId}`,
      params: options,
      extraRequestInit,
    });
  }

  /**
   * Delete multiples documents of an index.
   *
   * @param params - Params value can be:
   *
   *   - DocumentsDeletionQuery: An object containing the parameters to customize
   *       your document deletion. Only available in Meilisearch v1.2 and newer
   *   - DocumentsIds: An array of document ids to delete
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocuments(
    params: DocumentsDeletionQuery | DocumentsIds,
    options?: TaskEnqueueOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    // If params is of type DocumentsDeletionQuery
    const isDocumentsDeletionQuery =
      !Array.isArray(params) && typeof params === "object";
    const endpoint = isDocumentsDeletionQuery
      ? "documents/delete"
      : "documents/delete-batch";

    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/${endpoint}`,
      body: params,
      params: options,
      extraRequestInit,
    });
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteAllDocuments(
    options?: TaskEnqueueOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/documents`,
      params: options,
      extraRequestInit,
    });
  }

  /**
   * Compact the index database to reclaim space and improve read performance.
   *
   * @returns Promise containing an EnqueuedTask
   */
  compact(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/compact`,
      extraRequestInit,
    });
  }

  /**
   * This is an EXPERIMENTAL feature, which may break without a major version.
   * It's available after Meilisearch v1.10.
   *
   * More info about the feature:
   * https://github.com/orgs/meilisearch/discussions/762 More info about
   * experimental features in general:
   * https://www.meilisearch.com/docs/reference/api/experimental-features
   *
   * @param options - Object containing the function string and related options
   * @returns Promise containing an EnqueuedTask
   */
  updateDocumentsByFunction(
    options: UpdateDocumentsByFunctionOptions,
    taskOptions?: TaskEnqueueOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents/edit`,
      body: options,
      params: taskOptions,
      extraRequestInit,
    });
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   *
   * @returns Promise containing Settings object
   */
  async getSettings(extraRequestInit?: ExtraRequestInit): Promise<Settings> {
    return await this.httpRequest.get<Settings>({
      path: `indexes/${this.uid}/settings`,
      extraRequestInit,
    });
  }

  /**
   * Update all settings Any parameters not provided will be left unchanged.
   *
   * @param settings - Object containing parameters with their updated values
   * @returns Promise containing an EnqueuedTask
   */
  updateSettings(
    settings: Settings,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings`,
      body: settings,
      extraRequestInit,
    });
  }

  /**
   * Reset settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSettings(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings`,
      extraRequestInit,
    });
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /**
   * Get the pagination settings.
   *
   * @returns Promise containing object of pagination settings
   */
  async getPagination(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<PaginationSettings> {
    return await this.httpRequest.get<PaginationSettings>({
      path: `indexes/${this.uid}/settings/pagination`,
      extraRequestInit,
    });
  }

  /**
   * Update the pagination settings.
   *
   * @param pagination - Pagination object
   * @returns Promise containing an EnqueuedTask
   */
  updatePagination(
    pagination: PaginationSettings,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/pagination`,
      body: pagination,
      extraRequestInit,
    });
  }

  /**
   * Reset the pagination settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPagination(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/pagination`,
      extraRequestInit,
    });
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   *
   * @returns Promise containing record of synonym mappings
   */
  async getSynonyms(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Record<string, string[]>> {
    return await this.httpRequest.get<Record<string, string[]>>({
      path: `indexes/${this.uid}/settings/synonyms`,
      extraRequestInit,
    });
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   *
   * @param synonyms - Mapping of synonyms with their associated words
   * @returns Promise containing an EnqueuedTask
   */
  updateSynonyms(
    synonyms: Synonyms,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/synonyms`,
      body: synonyms,
      extraRequestInit,
    });
  }

  /**
   * Reset the synonym list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSynonyms(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/synonyms`,
      extraRequestInit,
    });
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   *
   * @returns Promise containing array of stop-words
   */
  async getStopWords(extraRequestInit?: ExtraRequestInit): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/stop-words`,
      extraRequestInit,
    });
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   *
   * @param stopWords - Array of strings that contains the stop-words.
   * @returns Promise containing an EnqueuedTask
   */
  updateStopWords(
    stopWords: StopWords,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/stop-words`,
      body: stopWords,
      extraRequestInit,
    });
  }

  /**
   * Reset the stop-words list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetStopWords(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/stop-words`,
      extraRequestInit,
    });
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   *
   * @returns Promise containing array of ranking-rules
   */
  async getRankingRules(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      extraRequestInit,
    });
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   *
   * @param rankingRules - Array that contain ranking rules sorted by order of
   *   importance.
   * @returns Promise containing an EnqueuedTask
   */
  updateRankingRules(
    rankingRules: RankingRules,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      body: rankingRules,
      extraRequestInit,
    });
  }

  /**
   * Reset the ranking rules list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetRankingRules(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      extraRequestInit,
    });
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   *
   * @returns Promise containing the distinct-attribute of the index
   */
  async getDistinctAttribute(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<DistinctAttribute> {
    return await this.httpRequest.get<DistinctAttribute>({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      extraRequestInit,
    });
  }

  /**
   * Update the distinct-attribute.
   *
   * @param distinctAttribute - Field name of the distinct-attribute
   * @returns Promise containing an EnqueuedTask
   */
  updateDistinctAttribute(
    distinctAttribute: DistinctAttribute,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      body: distinctAttribute,
      extraRequestInit,
    });
  }

  /**
   * Reset the distinct-attribute.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDistinctAttribute(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      extraRequestInit,
    });
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /**
   * Get the filterable-attributes
   *
   * @returns Promise containing an array of filterable-attributes
   */
  async getFilterableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<FilterableAttributes> {
    return await this.httpRequest.get<FilterableAttributes>({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      extraRequestInit,
    });
  }

  /**
   * Update the filterable-attributes.
   *
   * @param filterableAttributes - Array of strings containing the attributes
   *   that can be used as filters at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateFilterableAttributes(
    filterableAttributes: FilterableAttributes,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      body: filterableAttributes,
      extraRequestInit,
    });
  }

  /**
   * Reset the filterable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFilterableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      extraRequestInit,
    });
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /**
   * Get the sortable-attributes
   *
   * @returns Promise containing array of sortable-attributes
   */
  async getSortableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      extraRequestInit,
    });
  }

  /**
   * Update the sortable-attributes.
   *
   * @param sortableAttributes - Array of strings containing the attributes that
   *   can be used to sort search results at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateSortableAttributes(
    sortableAttributes: SortableAttributes,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      body: sortableAttributes,
      extraRequestInit,
    });
  }

  /**
   * Reset the sortable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSortableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      extraRequestInit,
    });
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   *
   * @returns Promise containing array of searchable-attributes
   */
  async getSearchableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      extraRequestInit,
    });
  }

  /**
   * Update the searchable-attributes.
   *
   * @param searchableAttributes - Array of strings that contains searchable
   *   attributes sorted by order of importance(most to least important)
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchableAttributes(
    searchableAttributes: SearchableAttributes,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      body: searchableAttributes,
      extraRequestInit,
    });
  }

  /**
   * Reset the searchable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchableAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      extraRequestInit,
    });
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   *
   * @returns Promise containing array of displayed-attributes
   */
  async getDisplayedAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      extraRequestInit,
    });
  }

  /**
   * Update the displayed-attributes.
   *
   * @param displayedAttributes - Array of strings that contains attributes of
   *   an index to display
   * @returns Promise containing an EnqueuedTask
   */
  updateDisplayedAttributes(
    displayedAttributes: DisplayedAttributes,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      body: displayedAttributes,
      extraRequestInit,
    });
  }

  /**
   * Reset the displayed-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDisplayedAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      extraRequestInit,
    });
  }

  ///
  /// TYPO TOLERANCE
  ///

  /**
   * Get the typo tolerance settings.
   *
   * @returns Promise containing the typo tolerance settings.
   */
  async getTypoTolerance(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<TypoTolerance> {
    return await this.httpRequest.get<TypoTolerance>({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      extraRequestInit,
    });
  }

  /**
   * Update the typo tolerance settings.
   *
   * @param typoTolerance - Object containing the custom typo tolerance
   *   settings.
   * @returns Promise containing object of the enqueued update
   */
  updateTypoTolerance(
    typoTolerance: TypoTolerance,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      body: typoTolerance,
      extraRequestInit,
    });
  }

  /**
   * Reset the typo tolerance settings.
   *
   * @returns Promise containing object of the enqueued update
   */
  resetTypoTolerance(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      extraRequestInit,
    });
  }

  ///
  /// FACETING
  ///

  /**
   * Get the faceting settings.
   *
   * @returns Promise containing object of faceting index settings
   */
  async getFaceting(extraRequestInit?: ExtraRequestInit): Promise<Faceting> {
    return await this.httpRequest.get<Faceting>({
      path: `indexes/${this.uid}/settings/faceting`,
      extraRequestInit,
    });
  }

  /**
   * Update the faceting settings.
   *
   * @param faceting - Faceting index settings object
   * @returns Promise containing an EnqueuedTask
   */
  updateFaceting(
    faceting: Faceting,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/faceting`,
      body: faceting,
      extraRequestInit,
    });
  }

  /**
   * Reset the faceting settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFaceting(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/faceting`,
      extraRequestInit,
    });
  }

  ///
  /// SEPARATOR TOKENS
  ///

  /**
   * Get the list of all separator tokens.
   *
   * @returns Promise containing array of separator tokens
   */
  async getSeparatorTokens(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      extraRequestInit,
    });
  }

  /**
   * Update the list of separator tokens. Overwrite the old list.
   *
   * @param separatorTokens - Array that contains separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateSeparatorTokens(
    separatorTokens: SeparatorTokens,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      body: separatorTokens,
      extraRequestInit,
    });
  }

  /**
   * Reset the separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSeparatorTokens(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      extraRequestInit,
    });
  }

  ///
  /// NON-SEPARATOR TOKENS
  ///

  /**
   * Get the list of all non-separator tokens.
   *
   * @returns Promise containing array of non-separator tokens
   */
  async getNonSeparatorTokens(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      extraRequestInit,
    });
  }

  /**
   * Update the list of non-separator tokens. Overwrite the old list.
   *
   * @param nonSeparatorTokens - Array that contains non-separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateNonSeparatorTokens(
    nonSeparatorTokens: NonSeparatorTokens,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      body: nonSeparatorTokens,
      extraRequestInit,
    });
  }

  /**
   * Reset the non-separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetNonSeparatorTokens(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      extraRequestInit,
    });
  }

  ///
  /// DICTIONARY
  ///

  /**
   * Get the dictionary settings of a Meilisearch index.
   *
   * @returns Promise containing the dictionary settings
   */
  async getDictionary(extraRequestInit?: ExtraRequestInit): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/dictionary`,
      extraRequestInit,
    });
  }

  /**
   * Update the dictionary settings. Overwrite the old settings.
   *
   * @param dictionary - Array that contains the new dictionary settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateDictionary(
    dictionary: Dictionary,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/dictionary`,
      body: dictionary,
      extraRequestInit,
    });
  }

  /**
   * Reset the dictionary settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDictionary(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/dictionary`,
      extraRequestInit,
    });
  }

  ///
  /// PROXIMITY PRECISION
  ///

  /**
   * Get the proximity precision settings of a Meilisearch index.
   *
   * @returns Promise containing the proximity precision settings
   */
  async getProximityPrecision(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ProximityPrecision> {
    return await this.httpRequest.get<ProximityPrecision>({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      extraRequestInit,
    });
  }

  /**
   * Update the proximity precision settings. Overwrite the old settings.
   *
   * @param proximityPrecision - String that contains the new proximity
   *   precision settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateProximityPrecision(
    proximityPrecision: ProximityPrecision,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      body: proximityPrecision,
      extraRequestInit,
    });
  }

  /**
   * Reset the proximity precision settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetProximityPrecision(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      extraRequestInit,
    });
  }

  ///
  /// EMBEDDERS
  ///

  /**
   * Get the embedders settings of a Meilisearch index.
   *
   * @returns Promise containing the embedders settings
   */
  async getEmbedders(extraRequestInit?: ExtraRequestInit): Promise<Embedders> {
    return await this.httpRequest.get<Embedders>({
      path: `indexes/${this.uid}/settings/embedders`,
      extraRequestInit,
    });
  }

  /**
   * Update the embedders settings. Overwrite the old settings.
   *
   * @param embedders - Object that contains the new embedders settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateEmbedders(
    embedders: Embedders,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/embedders`,
      body: embedders,
      extraRequestInit,
    });
  }

  /**
   * Reset the embedders settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetEmbedders(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/embedders`,
      extraRequestInit,
    });
  }

  ///
  /// SEARCHCUTOFFMS SETTINGS
  ///

  /**
   * Get the SearchCutoffMs settings.
   *
   * @returns Promise containing object of SearchCutoffMs settings
   */
  async getSearchCutoffMs(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchCutoffMs> {
    return await this.httpRequest.get<SearchCutoffMs>({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      extraRequestInit,
    });
  }

  /**
   * Update the SearchCutoffMs settings.
   *
   * @param searchCutoffMs - Object containing SearchCutoffMsSettings
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchCutoffMs(
    searchCutoffMs: SearchCutoffMs,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      body: searchCutoffMs,
      extraRequestInit,
    });
  }

  /**
   * Reset the SearchCutoffMs settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchCutoffMs(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      extraRequestInit,
    });
  }

  ///
  /// LOCALIZED ATTRIBUTES SETTINGS
  ///

  /**
   * Get the localized attributes settings.
   *
   * @returns Promise containing object of localized attributes settings
   */
  async getLocalizedAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<LocalizedAttributes> {
    return await this.httpRequest.get<LocalizedAttributes>({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      extraRequestInit,
    });
  }

  /**
   * Update the localized attributes settings.
   *
   * @param localizedAttributes - Localized attributes object
   * @returns Promise containing an EnqueuedTask
   */
  updateLocalizedAttributes(
    localizedAttributes: LocalizedAttributes,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      body: localizedAttributes,
      extraRequestInit,
    });
  }

  /**
   * Reset the localized attributes settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetLocalizedAttributes(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      extraRequestInit,
    });
  }

  ///
  /// FOREIGN KEYS SETTINGS
  ///

  /**
   * Get the foreign keys settings.
   *
   * @returns Promise containing an array of foreign key settings
   */
  async getForeignKeys(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ForeignKey[]> {
    return await this.httpRequest.get<ForeignKey[]>({
      path: `indexes/${this.uid}/settings/foreign-keys`,
      extraRequestInit,
    });
  }

  /**
   * Update the foreign keys settings.
   *
   * @param foreignKeys - Foreign keys array
   * @returns Promise containing an EnqueuedTask
   */
  updateForeignKeys(
    foreignKeys: ForeignKeys,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/foreign-keys`,
      body: foreignKeys,
      extraRequestInit,
    });
  }

  /**
   * Reset the foreign keys settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetForeignKeys(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/foreign-keys`,
      extraRequestInit,
    });
  }

  ///
  /// FACET SEARCH SETTINGS
  ///

  /**
   * Get the facet search settings.
   *
   * @returns Promise containing object of facet search settings
   */
  async getFacetSearch(extraRequestInit?: ExtraRequestInit): Promise<boolean> {
    return await this.httpRequest.get<boolean>({
      path: `indexes/${this.uid}/settings/facet-search`,
      extraRequestInit,
    });
  }

  /**
   * Update the facet search settings.
   *
   * @param facetSearch - Boolean value
   * @returns Promise containing an EnqueuedTask
   */
  updateFacetSearch(
    facetSearch: boolean,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/facet-search`,
      body: facetSearch,
      extraRequestInit,
    });
  }

  /**
   * Reset the facet search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFacetSearch(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/facet-search`,
      extraRequestInit,
    });
  }

  ///
  /// PREFIX SEARCH SETTINGS
  ///

  /**
   * Get the prefix search settings.
   *
   * @returns Promise containing object of prefix search settings
   */
  async getPrefixSearch(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<PrefixSearch> {
    return await this.httpRequest.get<PrefixSearch>({
      path: `indexes/${this.uid}/settings/prefix-search`,
      extraRequestInit,
    });
  }

  /**
   * Update the prefix search settings.
   *
   * @param prefixSearch - PrefixSearch value
   * @returns Promise containing an EnqueuedTask
   */
  updatePrefixSearch(
    prefixSearch: PrefixSearch,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/prefix-search`,
      body: prefixSearch,
      extraRequestInit,
    });
  }

  /**
   * Reset the prefix search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPrefixSearch(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/prefix-search`,
      extraRequestInit,
    });
  }

  ///
  /// CHAT SETTINGS
  ///

  /**
   * Get the index's chat settings.
   *
   * @returns Promise containing a ChatSettings object
   */
  async getChat(extraRequestInit?: ExtraRequestInit): Promise<ChatSettings> {
    return await this.httpRequest.get<ChatSettings>({
      path: `indexes/${this.uid}/settings/chat`,
      extraRequestInit,
    });
  }

  /**
   * Update the index's chat settings.
   *
   * @param chatSettings - ChatSettingsPayload object
   * @returns Promise containing an EnqueuedTask
   */
  updateChat(
    chatSettings: ChatSettingsPayload,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/chat`,
      body: chatSettings,
      extraRequestInit,
    });
  }

  ///
  /// FIELDS
  ///

  /**
   * Retrieve fields from an index with optional filtering and pagination. This
   * endpoint allows you to query fields based on their properties (searchable,
   * filterable, displayed, sortable, distinct, rankingRule, and localized).
   *
   * @param params - Query parameters including pagination and filter options
   * @param extraRequestInit - Additional request configuration options
   * @returns Promise containing the fields results with pagination info
   */
  async getFields(
    params?: FieldsQuery,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<FieldsResults> {
    return await this.httpRequest.post<FieldsResults>({
      path: `indexes/${this.uid}/fields`,
      body: params || {},
      extraRequestInit,
    });
  }
}
