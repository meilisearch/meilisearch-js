/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { MeiliSearchError } from "./errors/index.js";
import type {
  Config,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexObject,
  IndexOptions,
  IndexStats,
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
  UpdateDocumentsByFunctionOptions,
  ExtraRequestInit,
  PrefixSearch,
  RecordAny,
  EnqueuedTaskPromise,
  ChatSettings,
  ChatSettingsPayload,
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
        throw new MeiliSearchError(
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
  >(params: SearchSimilarDocumentsParams): Promise<SearchResponse<D, S>> {
    return await this.httpRequest.post<SearchResponse<D, S>>({
      path: `indexes/${this.uid}/similar`,
      body: params,
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
  async getRawInfo(): Promise<IndexObject> {
    const res = await this.httpRequest.get<IndexObject>({
      path: `indexes/${this.uid}`,
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
  async fetchInfo(): Promise<this> {
    await this.getRawInfo();
    return this;
  }

  /**
   * Get Primary Key.
   *
   * @returns Promise containing the Primary Key of the index
   */
  async fetchPrimaryKey(): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo()).primaryKey;
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
  ): EnqueuedTaskPromise {
    const httpRequests = new HttpRequests(config);
    return getHttpRequestsWithEnqueuedTaskPromise(
      httpRequests,
      new TaskClient(httpRequests),
    ).post({
      path: "indexes",
      body: { ...options, uid },
    });
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  update(data?: IndexOptions): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}`,
      body: data,
    });
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  delete(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}`,
    });
  }

  ///
  /// STATS
  ///

  /**
   * Get stats of an index
   *
   * @returns Promise containing object with stats of the index
   */
  async getStats(): Promise<IndexStats> {
    return await this.httpRequest.get<IndexStats>({
      path: `indexes/${this.uid}/stats`,
    });
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Get documents of an index.
   *
   * @param params - Parameters to browse the documents. Parameters can contain
   *   the `filter` field only available in Meilisearch v1.2 and newer
   * @returns Promise containing the returned documents
   */
  async getDocuments<D extends RecordAny = T>(
    params?: DocumentsQuery<D>,
  ): Promise<ResourceResults<D[]>> {
    const relativeBaseURL = `indexes/${this.uid}/documents`;

    return params?.filter !== undefined
      ? // In case `filter` is provided, use `POST /documents/fetch`
        await this.httpRequest.post<ResourceResults<D[]>>({
          path: `${relativeBaseURL}/fetch`,
          body: params,
        })
      : // Else use `GET /documents` method
        await this.httpRequest.get<ResourceResults<D[]>>({
          path: relativeBaseURL,
          params,
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
  ): Promise<D> {
    const fields = Array.isArray(parameters?.fields)
      ? parameters.fields.join()
      : undefined;

    return await this.httpRequest.get<D>({
      path: `indexes/${this.uid}/documents/${documentId}`,
      params: { ...parameters, fields },
    });
  }

  /**
   * Add or replace multiples documents to an index
   *
   * @param documents - Array of Document objects to add/replace
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocuments(documents: T[], options?: DocumentOptions): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
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
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.addDocuments(documents.slice(i, i + batchSize), options),
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
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
  ): EnqueuedTaskPromise[] {
    const updates: EnqueuedTaskPromise[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        this.updateDocuments(documents.slice(i, i + batchSize), options),
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
    });
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocument(documentId: string | number): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/documents/${documentId}`,
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
    });
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteAllDocuments(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/documents`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: `indexes/${this.uid}/documents/edit`,
      body: options,
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
  async getSettings(): Promise<Settings> {
    return await this.httpRequest.get<Settings>({
      path: `indexes/${this.uid}/settings`,
    });
  }

  /**
   * Update all settings Any parameters not provided will be left unchanged.
   *
   * @param settings - Object containing parameters with their updated values
   * @returns Promise containing an EnqueuedTask
   */
  updateSettings(settings: Settings): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings`,
      body: settings,
    });
  }

  /**
   * Reset settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSettings(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings`,
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
  async getPagination(): Promise<PaginationSettings> {
    return await this.httpRequest.get<PaginationSettings>({
      path: `indexes/${this.uid}/settings/pagination`,
    });
  }

  /**
   * Update the pagination settings.
   *
   * @param pagination - Pagination object
   * @returns Promise containing an EnqueuedTask
   */
  updatePagination(pagination: PaginationSettings): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/pagination`,
      body: pagination,
    });
  }

  /**
   * Reset the pagination settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPagination(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/pagination`,
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
  async getSynonyms(): Promise<Record<string, string[]>> {
    return await this.httpRequest.get<Record<string, string[]>>({
      path: `indexes/${this.uid}/settings/synonyms`,
    });
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   *
   * @param synonyms - Mapping of synonyms with their associated words
   * @returns Promise containing an EnqueuedTask
   */
  updateSynonyms(synonyms: Synonyms): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/synonyms`,
      body: synonyms,
    });
  }

  /**
   * Reset the synonym list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSynonyms(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/synonyms`,
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
  async getStopWords(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/stop-words`,
    });
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   *
   * @param stopWords - Array of strings that contains the stop-words.
   * @returns Promise containing an EnqueuedTask
   */
  updateStopWords(stopWords: StopWords): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/stop-words`,
      body: stopWords,
    });
  }

  /**
   * Reset the stop-words list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetStopWords(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/stop-words`,
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
  async getRankingRules(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/ranking-rules`,
    });
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   *
   * @param rankingRules - Array that contain ranking rules sorted by order of
   *   importance.
   * @returns Promise containing an EnqueuedTask
   */
  updateRankingRules(rankingRules: RankingRules): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      body: rankingRules,
    });
  }

  /**
   * Reset the ranking rules list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetRankingRules(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/ranking-rules`,
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
  async getDistinctAttribute(): Promise<DistinctAttribute> {
    return await this.httpRequest.get<DistinctAttribute>({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      body: distinctAttribute,
    });
  }

  /**
   * Reset the distinct-attribute.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDistinctAttribute(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
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
  async getFilterableAttributes(): Promise<FilterableAttributes> {
    return await this.httpRequest.get<FilterableAttributes>({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      body: filterableAttributes,
    });
  }

  /**
   * Reset the filterable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFilterableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
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
  async getSortableAttributes(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      body: sortableAttributes,
    });
  }

  /**
   * Reset the sortable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSortableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
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
  async getSearchableAttributes(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      body: searchableAttributes,
    });
  }

  /**
   * Reset the searchable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
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
  async getDisplayedAttributes(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      body: displayedAttributes,
    });
  }

  /**
   * Reset the displayed-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDisplayedAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
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
  async getTypoTolerance(): Promise<TypoTolerance> {
    return await this.httpRequest.get<TypoTolerance>({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
    });
  }

  /**
   * Update the typo tolerance settings.
   *
   * @param typoTolerance - Object containing the custom typo tolerance
   *   settings.
   * @returns Promise containing object of the enqueued update
   */
  updateTypoTolerance(typoTolerance: TypoTolerance): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      body: typoTolerance,
    });
  }

  /**
   * Reset the typo tolerance settings.
   *
   * @returns Promise containing object of the enqueued update
   */
  resetTypoTolerance(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
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
  async getFaceting(): Promise<Faceting> {
    return await this.httpRequest.get<Faceting>({
      path: `indexes/${this.uid}/settings/faceting`,
    });
  }

  /**
   * Update the faceting settings.
   *
   * @param faceting - Faceting index settings object
   * @returns Promise containing an EnqueuedTask
   */
  updateFaceting(faceting: Faceting): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/faceting`,
      body: faceting,
    });
  }

  /**
   * Reset the faceting settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFaceting(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/faceting`,
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
  async getSeparatorTokens(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/separator-tokens`,
    });
  }

  /**
   * Update the list of separator tokens. Overwrite the old list.
   *
   * @param separatorTokens - Array that contains separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateSeparatorTokens(separatorTokens: SeparatorTokens): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      body: separatorTokens,
    });
  }

  /**
   * Reset the separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSeparatorTokens(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/separator-tokens`,
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
  async getNonSeparatorTokens(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      body: nonSeparatorTokens,
    });
  }

  /**
   * Reset the non-separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetNonSeparatorTokens(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
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
  async getDictionary(): Promise<string[]> {
    return await this.httpRequest.get<string[]>({
      path: `indexes/${this.uid}/settings/dictionary`,
    });
  }

  /**
   * Update the dictionary settings. Overwrite the old settings.
   *
   * @param dictionary - Array that contains the new dictionary settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateDictionary(dictionary: Dictionary): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/dictionary`,
      body: dictionary,
    });
  }

  /**
   * Reset the dictionary settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDictionary(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/dictionary`,
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
  async getProximityPrecision(): Promise<ProximityPrecision> {
    return await this.httpRequest.get<ProximityPrecision>({
      path: `indexes/${this.uid}/settings/proximity-precision`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      body: proximityPrecision,
    });
  }

  /**
   * Reset the proximity precision settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetProximityPrecision(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/proximity-precision`,
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
  async getEmbedders(): Promise<Embedders> {
    return await this.httpRequest.get<Embedders>({
      path: `indexes/${this.uid}/settings/embedders`,
    });
  }

  /**
   * Update the embedders settings. Overwrite the old settings.
   *
   * @param embedders - Object that contains the new embedders settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateEmbedders(embedders: Embedders): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/embedders`,
      body: embedders,
    });
  }

  /**
   * Reset the embedders settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetEmbedders(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/embedders`,
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
  async getSearchCutoffMs(): Promise<SearchCutoffMs> {
    return await this.httpRequest.get<SearchCutoffMs>({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
    });
  }

  /**
   * Update the SearchCutoffMs settings.
   *
   * @param searchCutoffMs - Object containing SearchCutoffMsSettings
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchCutoffMs(searchCutoffMs: SearchCutoffMs): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      body: searchCutoffMs,
    });
  }

  /**
   * Reset the SearchCutoffMs settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchCutoffMs(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
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
  async getLocalizedAttributes(): Promise<LocalizedAttributes> {
    return await this.httpRequest.get<LocalizedAttributes>({
      path: `indexes/${this.uid}/settings/localized-attributes`,
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
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      body: localizedAttributes,
    });
  }

  /**
   * Reset the localized attributes settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetLocalizedAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/localized-attributes`,
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
  async getFacetSearch(): Promise<boolean> {
    return await this.httpRequest.get<boolean>({
      path: `indexes/${this.uid}/settings/facet-search`,
    });
  }

  /**
   * Update the facet search settings.
   *
   * @param facetSearch - Boolean value
   * @returns Promise containing an EnqueuedTask
   */
  updateFacetSearch(facetSearch: boolean): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/facet-search`,
      body: facetSearch,
    });
  }

  /**
   * Reset the facet search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFacetSearch(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/facet-search`,
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
  async getPrefixSearch(): Promise<PrefixSearch> {
    return await this.httpRequest.get<PrefixSearch>({
      path: `indexes/${this.uid}/settings/prefix-search`,
    });
  }

  /**
   * Update the prefix search settings.
   *
   * @param prefixSearch - PrefixSearch value
   * @returns Promise containing an EnqueuedTask
   */
  updatePrefixSearch(prefixSearch: PrefixSearch): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/prefix-search`,
      body: prefixSearch,
    });
  }

  /**
   * Reset the prefix search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPrefixSearch(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/prefix-search`,
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
  async getChat(): Promise<ChatSettings> {
    return await this.httpRequest.get<ChatSettings>({
      path: `indexes/${this.uid}/settings/chat`,
    });
  }

  /**
   * Update the index's chat settings.
   *
   * @param chatSettings - ChatSettingsPayload object
   * @returns Promise containing an EnqueuedTask
   */
  updateChat(chatSettings: ChatSettingsPayload): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/chat`,
      body: chatSettings,
    });
  }
}
