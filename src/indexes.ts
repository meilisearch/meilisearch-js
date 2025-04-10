/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { MeiliSearchError } from "./errors/index.js";
import type {
  Config,
  ContentType,
  DocumentOptions,
  DocumentQuery,
  DocumentsDeletionQuery,
  DocumentsIds,
  DocumentsQuery,
  EnqueuedTaskPromise,
  ExtraRequestInit,
  Filter,
  IndexObject,
  IndexOptions,
  IndexStats,
  IndividualUpdatableSettings,
  RawDocumentAdditionOptions,
  RecordAny,
  ResourceResults,
  SearchForFacetValuesParams,
  SearchForFacetValuesResponse,
  SearchParams,
  SearchRequestGET,
  SearchResponse,
  SearchSimilarDocumentsParams,
  Settings,
  UpdatableSettings,
  UpdateDocumentsByFunctionOptions,
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
      else if (Array.isArray(filter)) {
        throw new MeiliSearchError(
          "The filter query parameter should be in string format when using searchGet",
        );
      } else return undefined;
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

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-settings} */
  async getSettings(): Promise<Settings> {
    return await this.httpRequest.get<Settings>({
      path: `indexes/${this.uid}/settings`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-settings} */
  updateSettings(settings: UpdatableSettings): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings`,
      body: settings,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-settings} */
  resetSettings(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings`,
    });
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-pagination-settings} */
  async getPagination(): Promise<IndividualUpdatableSettings["pagination"]> {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["pagination"]
    >({
      path: `indexes/${this.uid}/settings/pagination`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-pagination-settings} */
  updatePagination(
    pagination: IndividualUpdatableSettings["pagination"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/pagination`,
      body: pagination,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-pagination-settings} */
  resetPagination(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/pagination`,
    });
  }

  ///
  /// SYNONYMS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-synonyms} */
  async getSynonyms(): Promise<IndividualUpdatableSettings["synonyms"]> {
    return await this.httpRequest.get<IndividualUpdatableSettings["synonyms"]>({
      path: `indexes/${this.uid}/settings/synonyms`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-synonyms} */
  updateSynonyms(
    synonyms: IndividualUpdatableSettings["synonyms"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/synonyms`,
      body: synonyms,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-synonyms} */
  resetSynonyms(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/synonyms`,
    });
  }

  ///
  /// STOP WORDS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-stop-words} */
  async getStopWords(): Promise<IndividualUpdatableSettings["stopWords"]> {
    return await this.httpRequest.get<IndividualUpdatableSettings["stopWords"]>(
      {
        path: `indexes/${this.uid}/settings/stop-words`,
      },
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-stop-words} */
  updateStopWords(
    stopWords: IndividualUpdatableSettings["stopWords"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/stop-words`,
      body: stopWords,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-stop-words} */
  resetStopWords(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/stop-words`,
    });
  }

  ///
  /// RANKING RULES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-ranking-rules} */
  async getRankingRules(): Promise<
    IndividualUpdatableSettings["rankingRules"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["rankingRules"]
    >({
      path: `indexes/${this.uid}/settings/ranking-rules`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-ranking-rules} */
  updateRankingRules(
    rankingRules: IndividualUpdatableSettings["rankingRules"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      body: rankingRules,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-ranking-rules} */
  resetRankingRules(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/ranking-rules`,
    });
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-distinct-attribute} */
  async getDistinctAttribute(): Promise<
    IndividualUpdatableSettings["distinctAttribute"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["distinctAttribute"]
    >({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-distinct-attribute} */
  updateDistinctAttribute(
    distinctAttribute: IndividualUpdatableSettings["distinctAttribute"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      body: distinctAttribute,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-distinct-attribute} */
  resetDistinctAttribute(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
    });
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-filterable-attributes} */
  async getFilterableAttributes(): Promise<
    IndividualUpdatableSettings["filterableAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["filterableAttributes"]
    >({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-filterable-attributes} */
  updateFilterableAttributes(
    filterableAttributes: IndividualUpdatableSettings["filterableAttributes"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      body: filterableAttributes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-filterable-attributes} */
  resetFilterableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
    });
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-sortable-attributes} */
  async getSortableAttributes(): Promise<
    IndividualUpdatableSettings["sortableAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["sortableAttributes"]
    >({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-sortable-attributes} */
  updateSortableAttributes(
    sortableAttributes: IndividualUpdatableSettings["sortableAttributes"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      body: sortableAttributes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-sortable-attributes} */
  resetSortableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
    });
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-searchable-attributes} */
  async getSearchableAttributes(): Promise<
    IndividualUpdatableSettings["searchableAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["searchableAttributes"]
    >({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-searchable-attributes} */
  updateSearchableAttributes(
    searchableAttributes: IndividualUpdatableSettings["searchableAttributes"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      body: searchableAttributes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-searchable-attributes} */
  resetSearchableAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
    });
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-displayed-attributes} */
  async getDisplayedAttributes(): Promise<
    IndividualUpdatableSettings["displayedAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["displayedAttributes"]
    >({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-displayed-attributes} */
  updateDisplayedAttributes(
    displayedAttributes: IndividualUpdatableSettings["displayedAttributes"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      body: displayedAttributes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-displayed-attributes} */
  resetDisplayedAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
    });
  }

  ///
  /// TYPO TOLERANCE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-typo-tolerance-settings} */
  async getTypoTolerance(): Promise<
    IndividualUpdatableSettings["typoTolerance"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["typoTolerance"]
    >({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-typo-tolerance-settings} */
  updateTypoTolerance(
    typoTolerance: IndividualUpdatableSettings["typoTolerance"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      body: typoTolerance,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-typo-tolerance-settings} */
  resetTypoTolerance(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
    });
  }

  ///
  /// FACETING
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-faceting-settings} */
  async getFaceting(): Promise<IndividualUpdatableSettings["faceting"]> {
    return await this.httpRequest.get<IndividualUpdatableSettings["faceting"]>({
      path: `indexes/${this.uid}/settings/faceting`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-faceting-settings} */
  updateFaceting(
    faceting: IndividualUpdatableSettings["faceting"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/faceting`,
      body: faceting,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-faceting-settings} */
  resetFaceting(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/faceting`,
    });
  }

  ///
  /// SEPARATOR TOKENS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-separator-tokens} */
  async getSeparatorTokens(): Promise<
    IndividualUpdatableSettings["separatorTokens"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["separatorTokens"]
    >({
      path: `indexes/${this.uid}/settings/separator-tokens`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-separator-tokens} */
  updateSeparatorTokens(
    separatorTokens: IndividualUpdatableSettings["separatorTokens"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      body: separatorTokens,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-separator-tokens} */
  resetSeparatorTokens(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/separator-tokens`,
    });
  }

  ///
  /// NON-SEPARATOR TOKENS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-non-separator-tokens} */
  async getNonSeparatorTokens(): Promise<
    IndividualUpdatableSettings["nonSeparatorTokens"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["nonSeparatorTokens"]
    >({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-non-separator-tokens} */
  updateNonSeparatorTokens(
    nonSeparatorTokens: IndividualUpdatableSettings["nonSeparatorTokens"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      body: nonSeparatorTokens,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-non-separator-tokens} */
  resetNonSeparatorTokens(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
    });
  }

  ///
  /// DICTIONARY
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-dictionary} */
  async getDictionary(): Promise<IndividualUpdatableSettings["dictionary"]> {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["dictionary"]
    >({
      path: `indexes/${this.uid}/settings/dictionary`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-dictionary} */
  updateDictionary(
    dictionary: IndividualUpdatableSettings["dictionary"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/dictionary`,
      body: dictionary,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-dictionary} */
  resetDictionary(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/dictionary`,
    });
  }

  ///
  /// PROXIMITY PRECISION
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-proximity-precision-settings} */
  async getProximityPrecision(): Promise<
    IndividualUpdatableSettings["proximityPrecision"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["proximityPrecision"]
    >({
      path: `indexes/${this.uid}/settings/proximity-precision`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-proximity-precision-settings} */
  updateProximityPrecision(
    proximityPrecision: IndividualUpdatableSettings["proximityPrecision"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      body: proximityPrecision,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-proximity-precision-settings} */
  resetProximityPrecision(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/proximity-precision`,
    });
  }

  ///
  /// EMBEDDERS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-embedder-settings} */
  async getEmbedders(): Promise<IndividualUpdatableSettings["embedders"]> {
    return await this.httpRequest.get<IndividualUpdatableSettings["embedders"]>(
      {
        path: `indexes/${this.uid}/settings/embedders`,
      },
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-embedder-settings} */
  updateEmbedders(
    embedders: IndividualUpdatableSettings["embedders"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${this.uid}/settings/embedders`,
      body: embedders,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-embedder-settings} */
  resetEmbedders(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/embedders`,
    });
  }

  ///
  /// SEARCHCUTOFFMS SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-search-cutoff} */
  async getSearchCutoffMs(): Promise<
    IndividualUpdatableSettings["searchCutoffMs"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["searchCutoffMs"]
    >({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-search-cutoff} */
  updateSearchCutoffMs(
    searchCutoffMs: IndividualUpdatableSettings["searchCutoffMs"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      body: searchCutoffMs,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-search-cutoff} */
  resetSearchCutoffMs(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
    });
  }

  ///
  /// LOCALIZED ATTRIBUTES SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-localized-attributes-settings} */
  async getLocalizedAttributes(): Promise<
    IndividualUpdatableSettings["localizedAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["localizedAttributes"]
    >({
      path: `indexes/${this.uid}/settings/localized-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-localized-attribute-settings} */
  updateLocalizedAttributes(
    localizedAttributes: IndividualUpdatableSettings["localizedAttributes"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      body: localizedAttributes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-localized-attributes-settings} */
  resetLocalizedAttributes(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/localized-attributes`,
    });
  }

  ///
  /// FACET SEARCH SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-facet-search-settings} */
  async getFacetSearch(): Promise<IndividualUpdatableSettings["facetSearch"]> {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["facetSearch"]
    >({
      path: `indexes/${this.uid}/settings/facet-search`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-facet-search-settings} */
  updateFacetSearch(
    facetSearch: IndividualUpdatableSettings["facetSearch"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/facet-search`,
      body: facetSearch,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-facet-search-settings} */
  resetFacetSearch(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/facet-search`,
    });
  }

  ///
  /// PREFIX SEARCH SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-prefix-search-settings} */
  async getPrefixSearch(): Promise<
    IndividualUpdatableSettings["prefixSearch"]
  > {
    return await this.httpRequest.get<
      IndividualUpdatableSettings["prefixSearch"]
    >({
      path: `indexes/${this.uid}/settings/prefix-search`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-prefix-search-settings} */
  updatePrefixSearch(
    prefixSearch: IndividualUpdatableSettings["prefixSearch"],
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.put({
      path: `indexes/${this.uid}/settings/prefix-search`,
      body: prefixSearch,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-prefix-search-settings} */
  resetPrefixSearch(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${this.uid}/settings/prefix-search`,
    });
  }
}
