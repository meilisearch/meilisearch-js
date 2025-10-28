/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

import { Index } from "./indexes.js";
import type {
  KeyCreation,
  Config,
  IndexOptions,
  IndexObject,
  Key,
  Health,
  Stats,
  Version,
  KeyUpdate,
  IndexesQuery,
  IndexesResults,
  KeysQuery,
  KeysResults,
  IndexSwap,
  MultiSearchParams,
  FederatedMultiSearchParams,
  MultiSearchResponseOrSearchResponse,
  EnqueuedTaskPromise,
  ExtraRequestInit,
  Network,
  RecordAny,
  RuntimeTogglableFeatures,
  ResourceResults,
  Webhook,
  ResultsWrapper,
  WebhookCreatePayload,
  WebhookUpdatePayload,
  UpdatableNetwork,
} from "./types/index.js";
import { ErrorStatusCode } from "./types/index.js";
import { HttpRequests } from "./http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
  type HttpRequestsWithEnqueuedTaskPromise,
} from "./task.js";
import { BatchClient } from "./batch.js";
import { ChatWorkspace } from "./chat-workspace.js";
import type { MeiliSearchApiError } from "./errors/index.js";

export class MeiliSearch {
  config: Config;
  httpRequest: HttpRequests;

  readonly #taskClient: TaskClient;
  get tasks() {
    return this.#taskClient;
  }

  readonly #batchClient: BatchClient;
  get batches() {
    return this.#batchClient;
  }

  readonly #httpRequestsWithTask: HttpRequestsWithEnqueuedTaskPromise;

  /**
   * Creates new MeiliSearch instance
   *
   * @param config - Configuration object
   */
  constructor(config: Config) {
    this.config = config;
    this.httpRequest = new HttpRequests(config);

    this.#taskClient = new TaskClient(
      this.httpRequest,
      config.defaultWaitOptions,
    );
    this.#batchClient = new BatchClient(this.httpRequest);

    this.#httpRequestsWithTask = getHttpRequestsWithEnqueuedTaskPromise(
      this.httpRequest,
      this.tasks,
    );
  }

  /**
   * Return an Index instance
   *
   * @param indexUid - The index UID
   * @returns Instance of Index
   */
  index<T extends RecordAny = RecordAny>(indexUid: string): Index<T> {
    return new Index<T>(this.config, indexUid);
  }

  /**
   * Gather information about an index by calling MeiliSearch and return an
   * Index instance with the gathered information
   *
   * @param indexUid - The index UID
   * @returns Promise returning Index instance
   */
  async getIndex<T extends RecordAny = RecordAny>(
    indexUid: string,
  ): Promise<Index<T>> {
    return new Index<T>(this.config, indexUid).fetchInfo();
  }

  /**
   * Gather information about an index by calling MeiliSearch and return the raw
   * JSON response
   *
   * @param indexUid - The index UID
   * @returns Promise returning index information
   */
  async getRawIndex(indexUid: string): Promise<IndexObject> {
    return new Index(this.config, indexUid).getRawInfo();
  }

  /**
   * Get all the indexes as Index instances.
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning array of raw index information
   */
  async getIndexes(
    parameters?: IndexesQuery,
  ): Promise<IndexesResults<Index[]>> {
    const rawIndexes = await this.getRawIndexes(parameters);
    const indexes: Index[] = rawIndexes.results.map(
      (index) => new Index(this.config, index.uid, index.primaryKey),
    );
    return { ...rawIndexes, results: indexes };
  }

  /**
   * Get all the indexes in their raw value (no Index instances).
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning array of raw index information
   */
  async getRawIndexes(
    parameters?: IndexesQuery,
  ): Promise<IndexesResults<IndexObject[]>> {
    return await this.httpRequest.get<IndexesResults<IndexObject[]>>({
      path: "indexes",
      params: parameters,
    });
  }

  /**
   * Create a new index
   *
   * @param uid - The index UID
   * @param options - Index options
   * @returns Promise returning Index instance
   */
  createIndex(uid: string, options?: IndexOptions): EnqueuedTaskPromise {
    return Index.create(uid, options, this.config);
  }

  /**
   * Update an index
   *
   * @param uid - The index UID
   * @param options - Index options to update
   * @returns Promise returning Index instance after updating
   */
  updateIndex(uid: string, options?: IndexOptions): EnqueuedTaskPromise {
    return new Index(this.config, uid).update(options);
  }

  /**
   * Delete an index
   *
   * @param uid - The index UID
   * @returns Promise which resolves when index is deleted successfully
   */
  deleteIndex(uid: string): EnqueuedTaskPromise {
    return new Index(this.config, uid).delete();
  }

  /**
   * Deletes an index if it already exists.
   *
   * @param uid - The index UID
   * @returns Promise which resolves to true when index exists and is deleted
   *   successfully, otherwise false if it does not exist
   */
  async deleteIndexIfExists(uid: string): Promise<boolean> {
    try {
      await this.deleteIndex(uid);
      return true;
    } catch (e) {
      if (
        (e as MeiliSearchApiError)?.cause?.code ===
        ErrorStatusCode.INDEX_NOT_FOUND
      ) {
        return false;
      }

      throw e;
    }
  }

  /**
   * Swaps a list of index tuples.
   *
   * @param params - List of indexes tuples to swap.
   * @returns Promise returning object of the enqueued task
   */
  swapIndexes(params: IndexSwap[]): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "swap-indexes",
      body: params,
    });
  }

  ///
  /// Multi Search
  ///

  /**
   * Perform multiple search queries.
   *
   * It is possible to make multiple search queries on the same index or on
   * different ones. With network feature enabled, you can also search across
   * remote instances.
   *
   * @example
   *
   * ```ts
   * client.multiSearch({
   *   queries: [
   *     { indexUid: "movies", q: "wonder" },
   *     { indexUid: "books", q: "flower" },
   *   ],
   * });
   *
   * // Federated search with remote instance (requires network feature enabled)
   * client.multiSearch({
   *   federation: {},
   *   queries: [
   *     {
   *       indexUid: "movies",
   *       q: "wonder",
   *       federationOptions: {
   *         remote: "meilisearch instance name",
   *       },
   *     },
   *     {
   *       indexUid: "movies",
   *       q: "wonder",
   *       federationOptions: {
   *         remote: "meilisearch instance name",
   *       },
   *     },
   *   ],
   * });
   * ```
   *
   * @param queries - Search queries
   * @param extraRequestInit - Additional request configuration options
   * @returns Promise containing the search responses
   * @see {@link https://www.meilisearch.com/docs/learn/multi_search/implement_sharding#perform-a-search}
   */
  async multiSearch<
    T1 extends MultiSearchParams | FederatedMultiSearchParams,
    T2 extends RecordAny = RecordAny,
  >(
    queries: T1,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<MultiSearchResponseOrSearchResponse<T1, T2>> {
    return await this.httpRequest.post<
      MultiSearchResponseOrSearchResponse<T1, T2>
    >({
      path: "multi-search",
      body: queries,
      extraRequestInit,
    });
  }

  ///
  /// CHATS
  ///

  /**
   * Get a chat workspace instance
   *
   * @param workspace - The chat workspace UID
   * @returns Instance of ChatWorkspace
   */
  chat(workspace: string): ChatWorkspace {
    return new ChatWorkspace(this.httpRequest, workspace);
  }

  /**
   * Get all chat workspaces
   *
   * @returns Promise returning an array of chat workspaces UIDs
   */
  async getChatWorkspaces(): Promise<ResourceResults<{ uid: string }[]>> {
    return await this.httpRequest.get({
      path: "chats",
    });
  }

  ///
  /// WEBHOOKS
  ///

  /**
   * Get all webhooks
   *
   * @returns Promise returning an object with webhooks
   */
  async getWebhooks(): Promise<ResultsWrapper<Webhook[]>> {
    return await this.httpRequest.get({ path: "webhooks" });
  }

  /**
   * Get a webhook
   *
   * @param uuid - Webhook UUID
   * @returns Promise returning the webhook
   */
  async getWebhook(uuid: string): Promise<Webhook> {
    return await this.httpRequest.get({ path: `webhooks/${uuid}` });
  }

  /**
   * Create a webhook
   *
   * @param webhook - Webhook to create
   * @returns Promise returning the created webhook
   */
  async createWebhook(webhook: WebhookCreatePayload): Promise<Webhook> {
    return await this.httpRequest.post({ path: "webhooks", body: webhook });
  }

  /**
   * Update a webhook
   *
   * @param uuid - Webhook UUID
   * @param webhook - Webhook to update
   * @returns Promise returning the updated webhook
   */
  async updateWebhook(
    uuid: string,
    webhook: WebhookUpdatePayload,
  ): Promise<Webhook> {
    return await this.httpRequest.patch({
      path: `webhooks/${uuid}`,
      body: webhook,
    });
  }

  /**
   * Delete a webhook
   *
   * @param uuid - Webhook UUID
   * @returns Promise returning void
   */
  async deleteWebhook(uuid: string): Promise<void> {
    await this.httpRequest.delete({ path: `webhooks/${uuid}` });
  }

  ///
  ///  Network
  ///

  /**
   * {@link https://www.meilisearch.com/docs/reference/api/network#get-the-network-object}
   *
   * @experimental
   */
  async getNetwork(): Promise<Network> {
    return await this.httpRequest.get({ path: "network" });
  }

  /**
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @experimental
   */
  async updateNetwork(options: UpdatableNetwork): Promise<Network> {
    return await this.httpRequest.patch({ path: "network", body: options });
  }

  ///
  /// KEYS
  ///

  /**
   * Get all API keys
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning an object with keys
   */
  async getKeys(parameters?: KeysQuery): Promise<KeysResults> {
    const keys = await this.httpRequest.get<KeysResults>({
      path: "keys",
      params: parameters,
    });

    keys.results = keys.results.map((key) => ({
      ...key,
      createdAt: new Date(key.createdAt),
      updatedAt: new Date(key.updatedAt),
    }));

    return keys;
  }

  /**
   * Get one API key
   *
   * @param keyOrUid - Key or uid of the API key
   * @returns Promise returning a key
   */
  async getKey(keyOrUid: string): Promise<Key> {
    return await this.httpRequest.get<Key>({
      path: `keys/${keyOrUid}`,
    });
  }

  /**
   * Create one API key
   *
   * @param options - Key options
   * @returns Promise returning a key
   */
  async createKey(options: KeyCreation): Promise<Key> {
    return await this.httpRequest.post<Key>({
      path: "keys",
      body: options,
    });
  }

  /**
   * Update one API key
   *
   * @param keyOrUid - Key
   * @param options - Key options
   * @returns Promise returning a key
   */
  async updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key> {
    return await this.httpRequest.patch<Key>({
      path: `keys/${keyOrUid}`,
      body: options,
    });
  }

  /**
   * Delete one API key
   *
   * @param keyOrUid - Key
   * @returns
   */
  async deleteKey(keyOrUid: string): Promise<void> {
    await this.httpRequest.delete({ path: `keys/${keyOrUid}` });
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   *
   * @returns Promise returning an object with health details
   */
  async health(): Promise<Health> {
    return await this.httpRequest.get<Health>({ path: "health" });
  }

  /**
   * Checks if the server is healthy, return true or false.
   *
   * @returns Promise returning a boolean
   */
  async isHealthy(): Promise<boolean> {
    try {
      const { status } = await this.health();
      return status === "available";
    } catch {
      return false;
    }
  }

  ///
  /// STATS
  ///

  /**
   * Get the stats of all the database
   *
   * @returns Promise returning object of all the stats
   */
  async getStats(): Promise<Stats> {
    return await this.httpRequest.get<Stats>({ path: "stats" });
  }

  ///
  /// VERSION
  ///

  /**
   * Get the version of MeiliSearch
   *
   * @returns Promise returning object with version details
   */
  async getVersion(): Promise<Version> {
    return await this.httpRequest.get<Version>({ path: "version" });
  }

  ///
  /// DUMPS
  ///

  /**
   * Creates a dump
   *
   * @returns Promise returning object of the enqueued task
   */
  createDump(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "dumps",
    });
  }

  ///
  /// SNAPSHOTS
  ///

  /**
   * Creates a snapshot
   *
   * @returns Promise returning object of the enqueued task
   */
  createSnapshot(): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "snapshots",
    });
  }

  ///
  /// EXPERIMENTAL-FEATURES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/experimental_features#get-all-experimental-features} */
  async getExperimentalFeatures(): Promise<RuntimeTogglableFeatures> {
    return await this.httpRequest.get({
      path: "experimental-features",
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/experimental_features#configure-experimental-features} */
  async updateExperimentalFeatures(
    runtimeTogglableFeatures: RuntimeTogglableFeatures,
  ): Promise<RuntimeTogglableFeatures> {
    return await this.httpRequest.patch({
      path: "experimental-features",
      body: runtimeTogglableFeatures,
    });
  }
}
