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
  EnqueuedTaskObject,
  ExtraRequestInit,
  Filter,
  IndexObject,
  IndexOptions,
  IndexStats,
  IndividualSettings,
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
  TasksQuery,
  TasksResults,
  UpdatableSettings,
  UpdateDocumentsByFunctionOptions,
  WaitOptions,
} from "./types/index.js";
import { HttpRequests } from "./http-requests.js";
import { Task, TaskClient } from "./task.js";
import { EnqueuedTask } from "./enqueued-task.js";

class Index<T extends RecordAny = RecordAny> {
  uid: string;
  primaryKey: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  httpRequest: HttpRequests;
  tasks: TaskClient;

  /**
   * @param config - Request configuration options
   * @param uid - UID of the index
   * @param primaryKey - Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid;
    this.primaryKey = primaryKey;
    this.httpRequest = new HttpRequests(config);
    this.tasks = new TaskClient(config);
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
  static async create(
    uid: string,
    options: IndexOptions = {},
    config: Config,
  ): Promise<EnqueuedTask> {
    const req = new HttpRequests(config);
    const task = await req.post<EnqueuedTaskObject>({
      path: "indexes",
      body: { ...options, uid },
    });

    return new EnqueuedTask(task);
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  async update(data: IndexOptions): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}`,
      body: data,
    });

    return new EnqueuedTask(task);
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  async delete(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// TASKS
  ///

  /**
   * Get the list of all the tasks of the index.
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getTasks(parameters?: TasksQuery): Promise<TasksResults> {
    return await this.tasks.getTasks({ ...parameters, indexUids: [this.uid] });
  }

  /**
   * Get one task of the index.
   *
   * @param taskUid - Task identifier
   * @returns Promise containing a task
   */
  async getTask(taskUid: number): Promise<Task> {
    return await this.tasks.getTask(taskUid);
  }

  /**
   * Wait for multiple tasks to be processed.
   *
   * @param taskUids - Tasks identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise containing an array of tasks
   */
  async waitForTasks(
    taskUids: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {},
  ): Promise<Task[]> {
    return await this.tasks.waitForTasks(taskUids, {
      timeOutMs,
      intervalMs,
    });
  }

  /**
   * Wait for a task to be processed.
   *
   * @param taskUid - Task identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise containing an array of tasks
   */
  async waitForTask(
    taskUid: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {},
  ): Promise<Task> {
    return await this.tasks.waitForTask(taskUid, {
      timeOutMs,
      intervalMs,
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

    // In case `filter` is provided, use `POST /documents/fetch`
    if (params?.filter !== undefined) {
      return await this.httpRequest.post<ResourceResults<D[]>>({
        path: `${relativeBaseURL}/fetch`,
        body: params,
      });
    } else {
      // Else use `GET /documents` method
      return await this.httpRequest.get<ResourceResults<D[]>>({
        path: relativeBaseURL,
        params,
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
  async getDocument<D extends RecordAny = T>(
    documentId: string | number,
    parameters?: DocumentQuery<T>,
  ): Promise<D> {
    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(",");
      }
      return undefined;
    })();

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
  async addDocuments(
    documents: T[],
    options?: DocumentOptions,
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.post<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
    });

    return new EnqueuedTask(task);
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
  async addDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.post<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
    });

    return new EnqueuedTask(task);
  }

  /**
   * Add or replace multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/replace
   * @param batchSize - Size of the batch
   * @param options - Options on document addition
   * @returns Promise containing array of enqueued task objects for each batch
   */
  async addDocumentsInBatches(
    documents: T[],
    batchSize = 1000,
    options?: DocumentOptions,
  ): Promise<EnqueuedTask[]> {
    const updates = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.addDocuments(documents.slice(i, i + batchSize), options),
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
  async updateDocuments(
    documents: Partial<T>[],
    options?: DocumentOptions,
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents`,
      params: options,
      body: documents,
    });

    return new EnqueuedTask(task);
  }

  /**
   * Add or update multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/update
   * @param batchSize - Size of the batch
   * @param options - Options on document update
   * @returns Promise containing array of enqueued task objects for each batch
   */
  async updateDocumentsInBatches(
    documents: Partial<T>[],
    batchSize = 1000,
    options?: DocumentOptions,
  ): Promise<EnqueuedTask[]> {
    const updates = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.updateDocuments(documents.slice(i, i + batchSize), options),
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
  async updateDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions,
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents`,
      body: documents,
      params: queryParams,
      contentType,
    });

    return new EnqueuedTask(task);
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @returns Promise containing an EnqueuedTask
   */
  async deleteDocument(documentId: string | number): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents/${documentId}`,
    });

    return new EnqueuedTask(task);
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
  async deleteDocuments(
    params: DocumentsDeletionQuery | DocumentsIds,
  ): Promise<EnqueuedTask> {
    // If params is of type DocumentsDeletionQuery
    const isDocumentsDeletionQuery =
      !Array.isArray(params) && typeof params === "object";
    const endpoint = isDocumentsDeletionQuery
      ? "documents/delete"
      : "documents/delete-batch";

    const task = await this.httpRequest.post<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/${endpoint}`,
      body: params,
    });

    return new EnqueuedTask(task);
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  async deleteAllDocuments(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents`,
    });

    return new EnqueuedTask(task);
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
  async updateDocumentsByFunction(
    options: UpdateDocumentsByFunctionOptions,
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.post<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/documents/edit`,
      body: options,
    });

    return new EnqueuedTask(task);
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
  async updateSettings(settings: UpdatableSettings): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings`,
      body: settings,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-settings} */
  async resetSettings(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-pagination-settings} */
  async getPagination(): Promise<IndividualSettings["pagination"]> {
    return await this.httpRequest.get<IndividualSettings["pagination"]>({
      path: `indexes/${this.uid}/settings/pagination`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-pagination-settings} */
  async updatePagination(
    pagination: IndividualSettings["pagination"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/pagination`,
      body: pagination,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-pagination-settings} */
  async resetPagination(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/pagination`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// SYNONYMS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-synonyms} */
  async getSynonyms(): Promise<IndividualSettings["synonyms"]> {
    return await this.httpRequest.get<IndividualSettings["synonyms"]>({
      path: `indexes/${this.uid}/settings/synonyms`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-synonyms} */
  async updateSynonyms(
    synonyms: IndividualSettings["synonyms"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/synonyms`,
      body: synonyms,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-synonyms} */
  async resetSynonyms(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/synonyms`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// STOP WORDS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-stop-words} */
  async getStopWords(): Promise<IndividualSettings["stopWords"]> {
    return await this.httpRequest.get<IndividualSettings["stopWords"]>({
      path: `indexes/${this.uid}/settings/stop-words`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-stop-words} */
  async updateStopWords(
    stopWords: IndividualSettings["stopWords"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/stop-words`,
      body: stopWords,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-stop-words} */
  async resetStopWords(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/stop-words`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// RANKING RULES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-ranking-rules} */
  async getRankingRules(): Promise<IndividualSettings["rankingRules"]> {
    return await this.httpRequest.get<IndividualSettings["rankingRules"]>({
      path: `indexes/${this.uid}/settings/ranking-rules`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-ranking-rules} */
  async updateRankingRules(
    rankingRules: IndividualSettings["rankingRules"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/ranking-rules`,
      body: rankingRules,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-ranking-rules} */
  async resetRankingRules(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/ranking-rules`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-distinct-attribute} */
  async getDistinctAttribute(): Promise<
    IndividualSettings["distinctAttribute"]
  > {
    return await this.httpRequest.get<IndividualSettings["distinctAttribute"]>({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-distinct-attribute} */
  async updateDistinctAttribute(
    distinctAttribute: IndividualSettings["distinctAttribute"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
      body: distinctAttribute,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-distinct-attribute} */
  async resetDistinctAttribute(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/distinct-attribute`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-filterable-attributes} */
  async getFilterableAttributes(): Promise<
    IndividualSettings["filterableAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualSettings["filterableAttributes"]
    >({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-filterable-attributes} */
  async updateFilterableAttributes(
    filterableAttributes: IndividualSettings["filterableAttributes"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
      body: filterableAttributes,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-filterable-attributes} */
  async resetFilterableAttributes(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/filterable-attributes`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-sortable-attributes} */
  async getSortableAttributes(): Promise<
    IndividualSettings["sortableAttributes"]
  > {
    return await this.httpRequest.get<IndividualSettings["sortableAttributes"]>(
      {
        path: `indexes/${this.uid}/settings/sortable-attributes`,
      },
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-sortable-attributes} */
  async updateSortableAttributes(
    sortableAttributes: IndividualSettings["sortableAttributes"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
      body: sortableAttributes,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-sortable-attributes} */
  async resetSortableAttributes(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/sortable-attributes`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-searchable-attributes} */
  async getSearchableAttributes(): Promise<
    IndividualSettings["searchableAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualSettings["searchableAttributes"]
    >({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-searchable-attributes} */
  async updateSearchableAttributes(
    searchableAttributes: IndividualSettings["searchableAttributes"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
      body: searchableAttributes,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-searchable-attributes} */
  async resetSearchableAttributes(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/searchable-attributes`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-displayed-attributes} */
  async getDisplayedAttributes(): Promise<
    IndividualSettings["displayedAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualSettings["displayedAttributes"]
    >({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-displayed-attributes} */
  async updateDisplayedAttributes(
    displayedAttributes: IndividualSettings["displayedAttributes"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
      body: displayedAttributes,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-displayed-attributes} */
  async resetDisplayedAttributes(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/displayed-attributes`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// TYPO TOLERANCE
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-typo-tolerance-settings} */
  async getTypoTolerance(): Promise<IndividualSettings["typoTolerance"]> {
    return await this.httpRequest.get<IndividualSettings["typoTolerance"]>({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-typo-tolerance-settings} */
  async updateTypoTolerance(
    typoTolerance: IndividualSettings["typoTolerance"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
      body: typoTolerance,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-typo-tolerance-settings} */
  async resetTypoTolerance(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/typo-tolerance`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// FACETING
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-faceting-settings} */
  async getFaceting(): Promise<IndividualSettings["faceting"]> {
    return await this.httpRequest.get<IndividualSettings["faceting"]>({
      path: `indexes/${this.uid}/settings/faceting`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-faceting-settings} */
  async updateFaceting(
    faceting: IndividualSettings["faceting"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/faceting`,
      body: faceting,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-faceting-settings} */
  async resetFaceting(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/faceting`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// SEPARATOR TOKENS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-separator-tokens} */
  async getSeparatorTokens(): Promise<IndividualSettings["separatorTokens"]> {
    return await this.httpRequest.get<IndividualSettings["separatorTokens"]>({
      path: `indexes/${this.uid}/settings/separator-tokens`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-separator-tokens} */
  async updateSeparatorTokens(
    separatorTokens: IndividualSettings["separatorTokens"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/separator-tokens`,
      body: separatorTokens,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-separator-tokens} */
  async resetSeparatorTokens(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/separator-tokens`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// NON-SEPARATOR TOKENS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-non-separator-tokens} */
  async getNonSeparatorTokens(): Promise<
    IndividualSettings["nonSeparatorTokens"]
  > {
    return await this.httpRequest.get<IndividualSettings["nonSeparatorTokens"]>(
      {
        path: `indexes/${this.uid}/settings/non-separator-tokens`,
      },
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-non-separator-tokens} */
  async updateNonSeparatorTokens(
    nonSeparatorTokens: IndividualSettings["nonSeparatorTokens"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
      body: nonSeparatorTokens,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-non-separator-tokens} */
  async resetNonSeparatorTokens(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/non-separator-tokens`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// DICTIONARY
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-dictionary} */
  async getDictionary(): Promise<IndividualSettings["dictionary"]> {
    return await this.httpRequest.get<IndividualSettings["dictionary"]>({
      path: `indexes/${this.uid}/settings/dictionary`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-dictionary} */
  async updateDictionary(
    dictionary: IndividualSettings["dictionary"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/dictionary`,
      body: dictionary,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-dictionary} */
  async resetDictionary(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/dictionary`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// PROXIMITY PRECISION
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-proximity-precision-settings} */
  async getProximityPrecision(): Promise<
    IndividualSettings["proximityPrecision"]
  > {
    return await this.httpRequest.get<IndividualSettings["proximityPrecision"]>(
      {
        path: `indexes/${this.uid}/settings/proximity-precision`,
      },
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-proximity-precision-settings} */
  async updateProximityPrecision(
    proximityPrecision: IndividualSettings["proximityPrecision"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/proximity-precision`,
      body: proximityPrecision,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-proximity-precision-settings} */
  async resetProximityPrecision(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/proximity-precision`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// EMBEDDERS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-embedder-settings} */
  async getEmbedders(): Promise<IndividualSettings["embedders"]> {
    return await this.httpRequest.get<IndividualSettings["embedders"]>({
      path: `indexes/${this.uid}/settings/embedders`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-embedder-settings} */
  async updateEmbedders(
    embedders: IndividualSettings["embedders"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.patch<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/embedders`,
      body: embedders,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-embedder-settings} */
  async resetEmbedders(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/embedders`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// SEARCHCUTOFFMS SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-search-cutoff} */
  async getSearchCutoffMs(): Promise<IndividualSettings["searchCutoffMs"]> {
    return await this.httpRequest.get<IndividualSettings["searchCutoffMs"]>({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-search-cutoff} */
  async updateSearchCutoffMs(
    searchCutoffMs: IndividualSettings["searchCutoffMs"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
      body: searchCutoffMs,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-search-cutoff} */
  async resetSearchCutoffMs(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/search-cutoff-ms`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// LOCALIZED ATTRIBUTES SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-localized-attributes-settings} */
  async getLocalizedAttributes(): Promise<
    IndividualSettings["localizedAttributes"]
  > {
    return await this.httpRequest.get<
      IndividualSettings["localizedAttributes"]
    >({
      path: `indexes/${this.uid}/settings/localized-attributes`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-localized-attribute-settings} */
  async updateLocalizedAttributes(
    localizedAttributes: IndividualSettings["localizedAttributes"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/localized-attributes`,
      body: localizedAttributes,
    });

    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-localized-attributes-settings} */
  async resetLocalizedAttributes(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/localized-attributes`,
    });

    return new EnqueuedTask(task);
  }

  ///
  /// FACET SEARCH SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-facet-search-settings} */
  async getFacetSearch(): Promise<IndividualSettings["facetSearch"]> {
    return await this.httpRequest.get<IndividualSettings["facetSearch"]>({
      path: `indexes/${this.uid}/settings/facet-search`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-facet-search-settings} */
  async updateFacetSearch(
    facetSearch: IndividualSettings["facetSearch"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/facet-search`,
      body: facetSearch,
    });
    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-facet-search-settings} */
  async resetFacetSearch(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/facet-search`,
    });
    return new EnqueuedTask(task);
  }

  ///
  /// PREFIX SEARCH SETTINGS
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#get-prefix-search-settings} */
  async getPrefixSearch(): Promise<IndividualSettings["prefixSearch"]> {
    return await this.httpRequest.get<IndividualSettings["prefixSearch"]>({
      path: `indexes/${this.uid}/settings/prefix-search`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#update-prefix-search-settings} */
  async updatePrefixSearch(
    prefixSearch: IndividualSettings["prefixSearch"],
  ): Promise<EnqueuedTask> {
    const task = await this.httpRequest.put<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/prefix-search`,
      body: prefixSearch,
    });
    return new EnqueuedTask(task);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/settings#reset-prefix-search-settings} */
  async resetPrefixSearch(): Promise<EnqueuedTask> {
    const task = await this.httpRequest.delete<EnqueuedTaskObject>({
      path: `indexes/${this.uid}/settings/prefix-search`,
    });
    return new EnqueuedTask(task);
  }
}

export { Index };
