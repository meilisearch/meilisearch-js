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
  Key,
  Health,
  Stats,
  Version,
  KeyUpdate,
  KeysQuery,
  KeysResults,
  SwapIndexesPayload,
  MultiSearchParams,
  FederatedMultiSearchParams,
  MultiSearchResponseOrSearchResponse,
  EnqueuedTaskPromise,
  ExtraRequestInit,
  Network,
  RecordAny,
  IndexViewList,
  ListIndexes,
  IndexView,
  IndexCreateRequest,
  UpdateIndexRequest,
} from "./types/index.js";
import { HttpRequests } from "./http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
  type HttpRequestsWithEnqueuedTaskPromise,
} from "./task.js";
import { BatchClient } from "./batch.js";
import type { MeiliSearchApiError } from "./errors/index.js";

type UidOrIndex = Index | string;

function getUid(value: UidOrIndex): string {
  return typeof value === "string" ? value : value.uid;
}

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
   * Get an {@link Index} instance.
   *
   * @param indexUid - The UID of the index
   * @returns An instance of {@link Index}
   */
  index<T extends RecordAny = RecordAny>(indexUid: string): Index<T> {
    return new Index<T>(this.config, indexUid);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#get-one-index} */
  async getIndex(uidOrIndex: UidOrIndex): Promise<IndexView> {
    return await this.httpRequest.get({
      path: `indexes/${getUid(uidOrIndex)}`,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#list-all-indexes} */
  async getIndexes(listIndexes?: ListIndexes): Promise<IndexViewList> {
    return await this.httpRequest.get({
      path: "indexes",
      params: listIndexes,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#create-an-index} */
  createIndex(indexCreateRequest: IndexCreateRequest): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "indexes",
      body: indexCreateRequest,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#update-an-index} */
  updateIndex(
    uidOrIndex: UidOrIndex,
    updateIndexRequest?: UpdateIndexRequest,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `indexes/${getUid(uidOrIndex)}`,
      body: updateIndexRequest,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#delete-an-index} */
  deleteIndex(uidOrIndex: UidOrIndex): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `indexes/${getUid(uidOrIndex)}`,
    });
  }

  /**
   * Deletes an index. In case it does not exist, this function will not throw.
   * Otherwise it's the same as {@link MeiliSearch.deleteIndex}.
   *
   * @param uidOrIndex - The UID of the index
   * @returns A promise that resolves to false if index does not exist,
   *   otherwise to true.
   */
  async deleteIndexIfExists(uidOrIndex: UidOrIndex): Promise<boolean> {
    try {
      await this.deleteIndex(uidOrIndex);
      return true;
    } catch (error) {
      if ((error as MeiliSearchApiError)?.cause?.code === "index_not_found") {
        return false;
      }

      throw error;
    }
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/indexes#swap-indexes} */
  swapIndexes(swapIndexesPayloads: SwapIndexesPayload[]): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "/swap-indexes",
      body: swapIndexesPayloads,
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
  async updateNetwork(network: Partial<Network>): Promise<Network> {
    return await this.httpRequest.patch({
      path: "network",
      body: network,
    });
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
}
