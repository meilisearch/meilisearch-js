/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import {
  MeiliSearchError,
  MeiliSearchRequestError,
  versionErrorHintMessage,
  MeiliSearchApiError,
} from "./errors/index.js";
import type {
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
  ResourceResults,
  RawDocumentAdditionOptions,
  ContentType,
  DocumentsIds,
  DocumentsDeletionQuery,
  SearchForFacetValuesParams,
  SearchForFacetValuesResponse,
  SearchSimilarDocumentsParams,
  UpdateDocumentsByFunctionOptions,
  Config,
  EnqueuedTaskPromise,
  RenameMeSettings,
  UpdateableSettings,
} from "./types/index.js";
import { removeUndefinedFromObject } from "./utils.js";
import { HttpRequests } from "./http-requests.js";
import type { getWaitTaskApplier } from "./task.js";

export class Index<T extends Record<string, any> = Record<string, any>> {
  uid: string;
  primaryKey: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  httpRequest: HttpRequests;
  readonly #applyWaitTask: ReturnType<typeof getWaitTaskApplier>;

  /**
   * @param config - Request configuration options
   * @param uid - UID of the index
   * @param primaryKey - Primary Key of the index
   */
  constructor(
    httpRequests: HttpRequests,
    applyWaitTask: ReturnType<typeof getWaitTaskApplier>,
    uid: string,
    primaryKey?: string,
  ) {
    this.httpRequest = httpRequests;
    this.#applyWaitTask = applyWaitTask;
    this.uid = uid;
    this.primaryKey = primaryKey;
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
  async search<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>,
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject({ q: query, ...options }),
      undefined,
      config,
    );
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
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>,
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`;

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

    return await this.httpRequest.get<SearchResponse<D, S>>(
      url,
      removeUndefinedFromObject(getParams),
      config,
    );
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
    config?: Partial<Request>,
  ): Promise<SearchForFacetValuesResponse> {
    const url = `indexes/${this.uid}/facet-search`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject(params),
      undefined,
      config,
    );
  }

  /**
   * Search for similar documents
   *
   * @param params - Parameters used to search for similar documents
   * @returns Promise containing the search response
   */
  async searchSimilarDocuments<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams,
  >(params: SearchSimilarDocumentsParams): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/similar`;

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject(params),
      undefined,
    );
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
    const url = `indexes/${this.uid}`;
    const res = await this.httpRequest.get<IndexObject>(url);
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
    applyWaitTask: ReturnType<typeof getWaitTaskApplier>,
  ): EnqueuedTaskPromise {
    const url = `indexes`;
    const req = new HttpRequests(config);
    return applyWaitTask(req.post(url, { ...options, uid }));
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  update(data?: IndexOptions): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}`;
    return this.#applyWaitTask(this.httpRequest.patch(url, data));
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  delete(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
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
    const url = `indexes/${this.uid}/stats`;
    return await this.httpRequest.get<IndexStats>(url);
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Get documents of an index.
   *
   * @param parameters - Parameters to browse the documents. Parameters can
   *   contain the `filter` field only available in Meilisearch v1.2 and newer
   * @returns Promise containing the returned documents
   */
  async getDocuments<D extends Record<string, any> = T>(
    parameters: DocumentsQuery<D> = {},
  ): Promise<ResourceResults<D[]>> {
    parameters = removeUndefinedFromObject(parameters);

    // In case `filter` is provided, use `POST /documents/fetch`
    if (parameters.filter !== undefined) {
      try {
        const url = `indexes/${this.uid}/documents/fetch`;

        return await this.httpRequest.post<
          DocumentsQuery,
          Promise<ResourceResults<D[]>>
        >(url, parameters);
      } catch (e) {
        if (e instanceof MeiliSearchRequestError) {
          e.message = versionErrorHintMessage(e.message, "getDocuments");
        } else if (e instanceof MeiliSearchApiError) {
          e.message = versionErrorHintMessage(e.message, "getDocuments");
        }

        throw e;
      }
      // Else use `GET /documents` method
    } else {
      const url = `indexes/${this.uid}/documents`;

      // Transform fields to query parameter string format
      const fields = Array.isArray(parameters?.fields)
        ? { fields: parameters?.fields?.join(",") }
        : {};

      return await this.httpRequest.get<Promise<ResourceResults<D[]>>>(url, {
        ...parameters,
        ...fields,
      });
    }
  }

  /**
   * Get one document
   *
   * @param documentId - Document ID
   * @param parameters - Parameters applied on a document
   * @returns Promise containing Document response
   */
  async getDocument<D extends Record<string, any> = T>(
    documentId: string | number,
    parameters?: DocumentQuery<T>,
  ): Promise<D> {
    const url = `indexes/${this.uid}/documents/${documentId}`;

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(",");
      }
      return undefined;
    })();

    return await this.httpRequest.get<D>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      }),
    );
  }

  /**
   * Add or replace multiples documents to an index
   *
   * @param documents - Array of Document objects to add/replace
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  addDocuments(documents: T[], options?: DocumentOptions): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#applyWaitTask(this.httpRequest.post(url, documents, options));
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
    const url = `indexes/${this.uid}/documents`;

    return this.#applyWaitTask(
      this.httpRequest.post(url, documents, queryParams, {
        headers: {
          "Content-Type": contentType,
        },
      }),
    );
  }

  // TODO: Deprecation text
  /**
   * Add or replace multiples documents to an index in batches
   *
   * @deprecated TODO
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
    documents: Array<Partial<T>>,
    options?: DocumentOptions,
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#applyWaitTask(this.httpRequest.put(url, documents, options));
  }

  // TODO: Deprecation text
  /**
   * Add or update multiples documents to an index in batches
   *
   * @deprecated TODO
   * @param documents - Array of Document objects to add/update
   * @param batchSize - Size of the batch
   * @param options - Options on document update
   * @returns Promise containing array of enqueued task objects for each batch
   */
  updateDocumentsInBatches(
    documents: Array<Partial<T>>,
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
    const url = `indexes/${this.uid}/documents`;

    return this.#applyWaitTask(
      this.httpRequest.put(url, documents, queryParams, {
        headers: {
          "Content-Type": contentType,
        },
      }),
    );
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @returns Promise containing an EnqueuedTask
   */
  deleteDocument(documentId: string | number): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents/${documentId}`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
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
    const url = `indexes/${this.uid}/${endpoint}`;

    return this.#applyWaitTask(
      this.httpRequest.post(url, params).catch((error) => {
        if (
          error instanceof MeiliSearchRequestError &&
          isDocumentsDeletionQuery
        ) {
          error.message = versionErrorHintMessage(
            error.message,
            "deleteDocuments",
          );
        } else if (error instanceof MeiliSearchApiError) {
          error.message = versionErrorHintMessage(
            error.message,
            "deleteDocuments",
          );
        }

        throw error;
      }),
    );
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  deleteAllDocuments(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/documents`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
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
    const url = `indexes/${this.uid}/documents/edit`;
    return this.#applyWaitTask(this.httpRequest.post(url, options));
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
    const url = `indexes/${this.uid}/settings`;
    return await this.httpRequest.get<Settings>(url);
  }

  /**
   * Update all settings Any parameters not provided will be left unchanged.
   *
   * @param settings - Object containing parameters with their updated values
   * @returns Promise containing an EnqueuedTask
   */
  updateSettings(settings: UpdateableSettings): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings`;
    return this.#applyWaitTask(this.httpRequest.patch(url, settings));
  }

  /**
   * Reset settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSettings(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /**
   * Get the pagination settings.
   *
   * @returns Promise containing object of pagination settings
   */
  async getPagination(): Promise<RenameMeSettings["pagination"]> {
    const url = `indexes/${this.uid}/settings/pagination`;
    return await this.httpRequest.get<RenameMeSettings["pagination"]>(url);
  }

  /**
   * Update the pagination settings.
   *
   * @param pagination - Pagination object
   * @returns Promise containing an EnqueuedTask
   */
  updatePagination(
    pagination: RenameMeSettings["pagination"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/pagination`;
    return this.#applyWaitTask(this.httpRequest.patch(url, pagination));
  }

  /**
   * Reset the pagination settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPagination(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/pagination`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   *
   * @returns Promise containing object of synonym mappings
   */
  async getSynonyms(): Promise<RenameMeSettings["synonyms"]> {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return await this.httpRequest.get<RenameMeSettings["synonyms"]>(url);
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   *
   * @param synonyms - Mapping of synonyms with their associated words
   * @returns Promise containing an EnqueuedTask
   */
  updateSynonyms(synonyms: RenameMeSettings["synonyms"]): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return this.#applyWaitTask(this.httpRequest.put(url, synonyms));
  }

  /**
   * Reset the synonym list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSynonyms(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/synonyms`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   *
   * @returns Promise containing array of stop-words
   */
  async getStopWords(): Promise<RenameMeSettings["stopWords"]> {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return await this.httpRequest.get<RenameMeSettings["stopWords"]>(url);
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   *
   * @param stopWords - Array of strings that contains the stop-words.
   * @returns Promise containing an EnqueuedTask
   */
  updateStopWords(
    stopWords: RenameMeSettings["stopWords"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return this.#applyWaitTask(this.httpRequest.put(url, stopWords));
  }

  /**
   * Reset the stop-words list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetStopWords(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/stop-words`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   *
   * @returns Promise containing array of ranking-rules
   */
  async getRankingRules(): Promise<RenameMeSettings["rankingRules"]> {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return await this.httpRequest.get<RenameMeSettings["rankingRules"]>(url);
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   *
   * @param rankingRules - Array that contain ranking rules sorted by order of
   *   importance.
   * @returns Promise containing an EnqueuedTask
   */
  updateRankingRules(
    rankingRules: RenameMeSettings["rankingRules"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return this.#applyWaitTask(this.httpRequest.put(url, rankingRules));
  }

  /**
   * Reset the ranking rules list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetRankingRules(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/ranking-rules`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   *
   * @returns Promise containing the distinct-attribute of the index
   */
  async getDistinctAttribute(): Promise<RenameMeSettings["distinctAttribute"]> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return await this.httpRequest.get<RenameMeSettings["distinctAttribute"]>(
      url,
    );
  }

  /**
   * Update the distinct-attribute.
   *
   * @param distinctAttribute - Field name of the distinct-attribute
   * @returns Promise containing an EnqueuedTask
   */
  updateDistinctAttribute(
    distinctAttribute: RenameMeSettings["distinctAttribute"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return this.#applyWaitTask(this.httpRequest.put(url, distinctAttribute));
  }

  /**
   * Reset the distinct-attribute.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDistinctAttribute(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/distinct-attribute`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /**
   * Get the filterable-attributes
   *
   * @returns Promise containing an array of filterable-attributes
   */
  async getFilterableAttributes(): Promise<
    RenameMeSettings["filterableAttributes"]
  > {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return await this.httpRequest.get<RenameMeSettings["filterableAttributes"]>(
      url,
    );
  }

  /**
   * Update the filterable-attributes.
   *
   * @param filterableAttributes - Array of strings containing the attributes
   *   that can be used as filters at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateFilterableAttributes(
    filterableAttributes: RenameMeSettings["filterableAttributes"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return this.#applyWaitTask(this.httpRequest.put(url, filterableAttributes));
  }

  /**
   * Reset the filterable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFilterableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/filterable-attributes`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /**
   * Get the sortable-attributes
   *
   * @returns Promise containing array of sortable-attributes
   */
  async getSortableAttributes(): Promise<
    RenameMeSettings["sortableAttributes"]
  > {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return await this.httpRequest.get<RenameMeSettings["sortableAttributes"]>(
      url,
    );
  }

  /**
   * Update the sortable-attributes.
   *
   * @param sortableAttributes - Array of strings containing the attributes that
   *   can be used to sort search results at query time
   * @returns Promise containing an EnqueuedTask
   */
  updateSortableAttributes(
    sortableAttributes: RenameMeSettings["sortableAttributes"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return this.#applyWaitTask(this.httpRequest.put(url, sortableAttributes));
  }

  /**
   * Reset the sortable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSortableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/sortable-attributes`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   *
   * @returns Promise containing array of searchable-attributes
   */
  async getSearchableAttributes(): Promise<
    RenameMeSettings["searchableAttributes"]
  > {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return await this.httpRequest.get<RenameMeSettings["searchableAttributes"]>(
      url,
    );
  }

  /**
   * Update the searchable-attributes.
   *
   * @param searchableAttributes - Array of strings that contains searchable
   *   attributes sorted by order of importance(most to least important)
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchableAttributes(
    searchableAttributes: RenameMeSettings["searchableAttributes"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return this.#applyWaitTask(this.httpRequest.put(url, searchableAttributes));
  }

  /**
   * Reset the searchable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchableAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/searchable-attributes`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   *
   * @returns Promise containing array of displayed-attributes
   */
  async getDisplayedAttributes(): Promise<
    RenameMeSettings["displayedAttributes"]
  > {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return await this.httpRequest.get<RenameMeSettings["displayedAttributes"]>(
      url,
    );
  }

  /**
   * Update the displayed-attributes.
   *
   * @param displayedAttributes - Array of strings that contains attributes of
   *   an index to display
   * @returns Promise containing an EnqueuedTask
   */
  updateDisplayedAttributes(
    displayedAttributes: RenameMeSettings["displayedAttributes"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return this.#applyWaitTask(this.httpRequest.put(url, displayedAttributes));
  }

  /**
   * Reset the displayed-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDisplayedAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/displayed-attributes`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// TYPO TOLERANCE
  ///

  /**
   * Get the typo tolerance settings.
   *
   * @returns Promise containing the typo tolerance settings.
   */
  async getTypoTolerance(): Promise<RenameMeSettings["typoTolerance"]> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return await this.httpRequest.get<RenameMeSettings["typoTolerance"]>(url);
  }

  /**
   * Update the typo tolerance settings.
   *
   * @param typoTolerance - Object containing the custom typo tolerance
   *   settings.
   * @returns Promise containing object of the enqueued update
   */
  updateTypoTolerance(
    typoTolerance: RenameMeSettings["typoTolerance"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return this.#applyWaitTask(this.httpRequest.patch(url, typoTolerance));
  }

  /**
   * Reset the typo tolerance settings.
   *
   * @returns Promise containing object of the enqueued update
   */
  resetTypoTolerance(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/typo-tolerance`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// FACETING
  ///

  /**
   * Get the faceting settings.
   *
   * @returns Promise containing object of faceting index settings
   */
  async getFaceting(): Promise<RenameMeSettings["faceting"]> {
    const url = `indexes/${this.uid}/settings/faceting`;
    return await this.httpRequest.get<RenameMeSettings["faceting"]>(url);
  }

  /**
   * Update the faceting settings.
   *
   * @param faceting - Faceting index settings object
   * @returns Promise containing an EnqueuedTask
   */
  updateFaceting(faceting: RenameMeSettings["faceting"]): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/faceting`;
    return this.#applyWaitTask(this.httpRequest.patch(url, faceting));
  }

  /**
   * Reset the faceting settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFaceting(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/faceting`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// SEPARATOR TOKENS
  ///

  /**
   * Get the list of all separator tokens.
   *
   * @returns Promise containing array of separator tokens
   */
  async getSeparatorTokens(): Promise<RenameMeSettings["separatorTokens"]> {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return await this.httpRequest.get<RenameMeSettings["separatorTokens"]>(url);
  }

  /**
   * Update the list of separator tokens. Overwrite the old list.
   *
   * @param separatorTokens - Array that contains separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateSeparatorTokens(
    separatorTokens: RenameMeSettings["separatorTokens"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return this.#applyWaitTask(this.httpRequest.put(url, separatorTokens));
  }

  /**
   * Reset the separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSeparatorTokens(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/separator-tokens`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// NON-SEPARATOR TOKENS
  ///

  /**
   * Get the list of all non-separator tokens.
   *
   * @returns Promise containing array of non-separator tokens
   */
  async getNonSeparatorTokens(): Promise<
    RenameMeSettings["nonSeparatorTokens"]
  > {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return await this.httpRequest.get<RenameMeSettings["nonSeparatorTokens"]>(
      url,
    );
  }

  /**
   * Update the list of non-separator tokens. Overwrite the old list.
   *
   * @param nonSeparatorTokens - Array that contains non-separator tokens.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateNonSeparatorTokens(
    nonSeparatorTokens: RenameMeSettings["nonSeparatorTokens"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return this.#applyWaitTask(this.httpRequest.put(url, nonSeparatorTokens));
  }

  /**
   * Reset the non-separator tokens list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetNonSeparatorTokens(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/non-separator-tokens`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// DICTIONARY
  ///

  /**
   * Get the dictionary settings of a Meilisearch index.
   *
   * @returns Promise containing the dictionary settings
   */
  async getDictionary(): Promise<RenameMeSettings["dictionary"]> {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return await this.httpRequest.get<RenameMeSettings["dictionary"]>(url);
  }

  /**
   * Update the dictionary settings. Overwrite the old settings.
   *
   * @param dictionary - Array that contains the new dictionary settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateDictionary(
    dictionary: RenameMeSettings["dictionary"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return this.#applyWaitTask(this.httpRequest.put(url, dictionary));
  }

  /**
   * Reset the dictionary settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetDictionary(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/dictionary`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// PROXIMITY PRECISION
  ///

  /**
   * Get the proximity precision settings of a Meilisearch index.
   *
   * @returns Promise containing the proximity precision settings
   */
  async getProximityPrecision(): Promise<
    RenameMeSettings["proximityPrecision"]
  > {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return await this.httpRequest.get<RenameMeSettings["proximityPrecision"]>(
      url,
    );
  }

  /**
   * Update the proximity precision settings. Overwrite the old settings.
   *
   * @param proximityPrecision - String that contains the new proximity
   *   precision settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateProximityPrecision(
    proximityPrecision: RenameMeSettings["proximityPrecision"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return this.#applyWaitTask(this.httpRequest.put(url, proximityPrecision));
  }

  /**
   * Reset the proximity precision settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetProximityPrecision(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/proximity-precision`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// EMBEDDERS
  ///

  /**
   * Get the embedders settings of a Meilisearch index.
   *
   * @returns Promise containing the embedders settings
   */
  async getEmbedders(): Promise<RenameMeSettings["embedders"]> {
    const url = `indexes/${this.uid}/settings/embedders`;
    return await this.httpRequest.get<RenameMeSettings["embedders"]>(url);
  }

  /**
   * Update the embedders settings. Overwrite the old settings.
   *
   * @param embedders - Object that contains the new embedders settings.
   * @returns Promise containing an EnqueuedTask or null
   */
  updateEmbedders(
    embedders: RenameMeSettings["embedders"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/embedders`;
    return this.#applyWaitTask(this.httpRequest.patch(url, embedders));
  }

  /**
   * Reset the embedders settings to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetEmbedders(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/embedders`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// SEARCHCUTOFFMS SETTINGS
  ///

  /**
   * Get the SearchCutoffMs settings.
   *
   * @returns Promise containing object of SearchCutoffMs settings
   */
  async getSearchCutoffMs(): Promise<RenameMeSettings["searchCutoffMs"]> {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return await this.httpRequest.get<RenameMeSettings["searchCutoffMs"]>(url);
  }

  /**
   * Update the SearchCutoffMs settings.
   *
   * @param searchCutoffMs - Object containing SearchCutoffMsSettings
   * @returns Promise containing an EnqueuedTask
   */
  updateSearchCutoffMs(
    searchCutoffMs: RenameMeSettings["searchCutoffMs"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return this.#applyWaitTask(this.httpRequest.put(url, searchCutoffMs));
  }

  /**
   * Reset the SearchCutoffMs settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetSearchCutoffMs(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/search-cutoff-ms`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// LOCALIZED ATTRIBUTES SETTINGS
  ///

  /**
   * Get the localized attributes settings.
   *
   * @returns Promise containing object of localized attributes settings
   */
  async getLocalizedAttributes(): Promise<
    RenameMeSettings["localizedAttributes"]
  > {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return await this.httpRequest.get<RenameMeSettings["localizedAttributes"]>(
      url,
    );
  }

  /**
   * Update the localized attributes settings.
   *
   * @param localizedAttributes - Localized attributes object
   * @returns Promise containing an EnqueuedTask
   */
  updateLocalizedAttributes(
    localizedAttributes: RenameMeSettings["localizedAttributes"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return this.#applyWaitTask(this.httpRequest.put(url, localizedAttributes));
  }

  /**
   * Reset the localized attributes settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetLocalizedAttributes(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/localized-attributes`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// FACET SEARCH SETTINGS
  ///

  /**
   * Get the facet search settings.
   *
   * @returns Promise containing object of facet search settings
   */
  async getFacetSearch(): Promise<RenameMeSettings["facetSearch"]> {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return await this.httpRequest.get<RenameMeSettings["facetSearch"]>(url);
  }

  /**
   * Update the facet search settings.
   *
   * @param facetSearch - Boolean value
   * @returns Promise containing an EnqueuedTask
   */
  updateFacetSearch(
    facetSearch: RenameMeSettings["facetSearch"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return this.#applyWaitTask(this.httpRequest.put(url, facetSearch));
  }

  /**
   * Reset the facet search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetFacetSearch(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/facet-search`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }

  ///
  /// PREFIX SEARCH SETTINGS
  ///

  /**
   * Get the prefix search settings.
   *
   * @returns Promise containing object of prefix search settings
   */
  async getPrefixSearch(): Promise<RenameMeSettings["prefixSearch"]> {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return await this.httpRequest.get<RenameMeSettings["prefixSearch"]>(url);
  }

  /**
   * Update the prefix search settings.
   *
   * @param prefixSearch - PrefixSearch value
   * @returns Promise containing an EnqueuedTask
   */
  updatePrefixSearch(
    prefixSearch: RenameMeSettings["prefixSearch"],
  ): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return this.#applyWaitTask(this.httpRequest.put(url, prefixSearch));
  }

  /**
   * Reset the prefix search settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  resetPrefixSearch(): EnqueuedTaskPromise {
    const url = `indexes/${this.uid}/settings/prefix-search`;
    return this.#applyWaitTask(this.httpRequest.delete(url));
  }
}
