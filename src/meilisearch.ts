/*
 * Bundle: Meilisearch
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
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
  StatsQuery,
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
  EnqueuedTask,
  EnqueuedTaskPromise,
  ExtraRequestInit,
  Network,
  RecordAny,
  RuntimeTogglableFeatures,
  ResourceResults,
  SearchRule,
  SearchRuleUpdatePayload,
  SearchRuleListPayload,
  Remote,
  Webhook,
  ResultsWrapper,
  WebhookCreatePayload,
  WebhookUpdatePayload,
  InitializeNetworkOptions,
  AddRemoteOptions,
  RemoveRemoteOptions,
  UpdateNetworkOptions,
  ShardInitialization,
  RenderTemplateParams,
  RenderTemplateResponse,
  ChatWorkspaceObject,
  ChatWorkspacesQuery,
  ChatWorkspacesResults,
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
import { MeilisearchError } from "./errors/index.js";

export class Meilisearch {
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
   * Creates new Meilisearch instance
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
   * Gather information about an index by calling Meilisearch and return an
   * Index instance with the gathered information
   *
   * @param indexUid - The index UID
   * @returns Promise returning Index instance
   */
  async getIndex<T extends RecordAny = RecordAny>(
    indexUid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Index<T>> {
    return new Index<T>(this.config, indexUid).fetchInfo(extraRequestInit);
  }

  /**
   * Gather information about an index by calling Meilisearch and return the raw
   * JSON response
   *
   * @param indexUid - The index UID
   * @returns Promise returning index information
   */
  async getRawIndex(
    indexUid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<IndexObject> {
    return new Index(this.config, indexUid).getRawInfo(extraRequestInit);
  }

  /**
   * Get all the indexes as Index instances.
   *
   * @param parameters - Parameters to browse the indexes
   * @returns Promise returning array of raw index information
   */
  async getIndexes(
    parameters?: IndexesQuery,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<IndexesResults<Index[]>> {
    const rawIndexes = await this.getRawIndexes(parameters, extraRequestInit);
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
    extraRequestInit?: ExtraRequestInit,
  ): Promise<IndexesResults<IndexObject[]>> {
    return await this.httpRequest.get<IndexesResults<IndexObject[]>>({
      path: "indexes",
      params: parameters,
      extraRequestInit,
    });
  }

  /**
   * Create a new index
   *
   * @param uid - The index UID
   * @param options - Index options
   * @returns Promise returning Index instance
   */
  createIndex(
    uid: string,
    options?: IndexOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return Index.create(uid, options, this.config, extraRequestInit);
  }

  /**
   * Update an index
   *
   * @param uid - The index UID
   * @param options - Index options to update
   * @returns Promise returning Index instance after updating
   */
  updateIndex(
    uid: string,
    options?: IndexOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return new Index(this.config, uid).update(options, extraRequestInit);
  }

  /**
   * Delete an index
   *
   * @param uid - The index UID
   * @returns Promise which resolves when index is deleted successfully
   */
  deleteIndex(
    uid: string,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return new Index(this.config, uid).delete(extraRequestInit);
  }

  /**
   * Deletes an index if it already exists.
   *
   * @param uid - The index UID
   * @returns Promise which resolves to true when index exists and is deleted
   *   successfully, otherwise false if it does not exist
   */
  async deleteIndexIfExists(
    uid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<boolean> {
    // The HTTP API accepts the deletion of an index that does not exist and
    // enqueues a task that fails with `index_not_found`, so the outcome is only
    // known once that task has been processed.
    const task = await this.deleteIndex(uid, extraRequestInit).waitTask(
      extraRequestInit === undefined ? undefined : { extraRequestInit },
    );

    if (task.status === "succeeded") {
      return true;
    }

    if (task.error?.code === ErrorStatusCode.INDEX_NOT_FOUND) {
      return false;
    }

    throw new MeilisearchError(
      task.error?.message ?? `Failed to delete index \`${uid}\`.`,
    );
  }

  /**
   * Swaps a list of index tuples.
   *
   * @param params - List of indexes tuples to swap.
   * @returns Promise returning object of the enqueued task
   */
  swapIndexes(
    params: IndexSwap[],
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "swap-indexes",
      body: params,
      extraRequestInit,
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
   * List all chat workspaces
   *
   * @param parameters - Parameters to paginate the chat workspaces
   * @returns Promise returning a paginated list of chat workspaces
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/chats/list-chat-workspaces}
   */
  async getChatWorkspaces(
    parameters?: ChatWorkspacesQuery,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ChatWorkspacesResults> {
    return await this.httpRequest.get({
      path: "chats",
      params: parameters,
      extraRequestInit,
    });
  }

  /**
   * Get a chat workspace
   *
   * @param workspace - The chat workspace UID
   * @returns Promise returning the chat workspace
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/chats/get-a-chat-workspace}
   */
  async getChatWorkspace(
    workspace: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ChatWorkspaceObject> {
    return await this.httpRequest.get({
      path: `chats/${workspace}`,
      extraRequestInit,
    });
  }

  /**
   * Delete a chat workspace
   *
   * @param workspace - The chat workspace UID
   * @returns Promise returning void
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/chats/delete-a-chat-workspace}
   */
  async deleteChatWorkspace(
    workspace: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<void> {
    await this.httpRequest.delete({
      path: `chats/${workspace}`,
      extraRequestInit,
    });
  }

  ///
  /// DYNAMIC SEARCH RULES
  ///

  /**
   * Get all dynamic search rules
   *
   * @param parameters - Parameters to browse dynamic search rules
   * @returns Promise returning an object with dynamic search rules
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/search-rules/list-search-rules}
   */
  async getDynamicSearchRules(
    parameters?: SearchRuleListPayload,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ResourceResults<SearchRule[]>> {
    return await this.httpRequest.post({
      path: "dynamic-search-rules",
      body: parameters ?? {},
      extraRequestInit,
    });
  }

  /**
   * Get a dynamic search rule
   *
   * @param uid - Dynamic search rule UID
   * @returns Promise returning the dynamic search rule
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/search-rules/get-a-search-rule}
   */
  async getDynamicSearchRule(
    uid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<SearchRule> {
    return await this.httpRequest.get({
      path: `dynamic-search-rules/${uid}`,
      extraRequestInit,
    });
  }

  /**
   * Update a dynamic search rule
   *
   * @param uid - Dynamic search rule UID
   * @param rule - Partial search rule with pin and scale actions
   * @returns Promise returning an enqueued task
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/search-rules/create-or-update-a-search-rule}
   */
  updateDynamicSearchRule(
    uid: string,
    rule: SearchRuleUpdatePayload,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: `dynamic-search-rules/${uid}`,
      body: rule,
      extraRequestInit,
    });
  }

  /**
   * Delete a dynamic search rule
   *
   * @param uid - Dynamic search rule UID
   * @returns Promise returning an enqueued task
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/search-rules/delete-a-search-rule}
   */
  deleteDynamicSearchRule(
    uid: string,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: `dynamic-search-rules/${uid}`,
      extraRequestInit,
    });
  }

  /**
   * Delete all dynamic search rules
   *
   * @returns Promise returning an enqueued task
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/search-rules/delete-all-search-rules}
   */
  deleteAllDynamicSearchRules(
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.delete({
      path: "dynamic-search-rules",
      extraRequestInit,
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
  async getWebhooks(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<ResultsWrapper<Webhook[]>> {
    return await this.httpRequest.get({ path: "webhooks", extraRequestInit });
  }

  /**
   * Get a webhook
   *
   * @param uuid - Webhook UUID
   * @returns Promise returning the webhook
   */
  async getWebhook(
    uuid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Webhook> {
    return await this.httpRequest.get({
      path: `webhooks/${uuid}`,
      extraRequestInit,
    });
  }

  /**
   * Create a webhook
   *
   * @param webhook - Webhook to create
   * @returns Promise returning the created webhook
   */
  async createWebhook(
    webhook: WebhookCreatePayload,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Webhook> {
    return await this.httpRequest.post({
      path: "webhooks",
      body: webhook,
      extraRequestInit,
    });
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
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Webhook> {
    return await this.httpRequest.patch({
      path: `webhooks/${uuid}`,
      body: webhook,
      extraRequestInit,
    });
  }

  /**
   * Delete a webhook
   *
   * @param uuid - Webhook UUID
   * @returns Promise returning void
   */
  async deleteWebhook(
    uuid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<void> {
    await this.httpRequest.delete({
      path: `webhooks/${uuid}`,
      extraRequestInit,
    });
  }

  ///
  ///  Network
  ///

  #patchNetwork(
    body: UpdateNetworkOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.patch({
      path: "network",
      body,
      extraRequestInit,
    });
  }

  #validateInitializationShards(
    remotes: Record<string, Remote>,
    shards: Record<string, ShardInitialization>,
  ): Record<string, { remotes: string[] }> {
    const shardEntries = Object.entries(shards);

    if (shardEntries.length === 0) {
      throw new TypeError(
        "initializeNetwork requires at least one shard when leader is set.",
      );
    }

    const validated: Record<string, { remotes: string[] }> = {};

    for (const [shardName, shard] of shardEntries) {
      if (!Array.isArray(shard.remotes) || shard.remotes.length === 0) {
        throw new TypeError(
          `Shard "${shardName}" must have at least one remote.`,
        );
      }

      const missingRemotes = shard.remotes.filter(
        (remoteName) => remotes[remoteName] === undefined,
      );

      if (missingRemotes.length > 0) {
        throw new TypeError(
          `Shard "${shardName}" references unknown remotes: ${missingRemotes.join(
            ", ",
          )}`,
        );
      }

      validated[shardName] = { remotes: [...shard.remotes] };
    }

    return validated;
  }

  /**
   * Get the current network configuration.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#get-the-network-object}
   *
   * @experimental
   */
  async getNetwork(extraRequestInit?: ExtraRequestInit): Promise<Network> {
    return await this.httpRequest.get({ path: "network", extraRequestInit });
  }

  /**
   * Update the network configuration. Must be called on the leader instance
   * when a leader is configured.
   *
   * When a leader is set, returns an enqueued `networkTopologyChange` task.
   * When clearing the leader (or when no leader is set), returns the updated
   * network object synchronously.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param options - Network update options
   * @returns Promise returning an enqueued task, or the updated network object
   * @experimental
   */
  async updateNetwork(
    options: UpdateNetworkOptions,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<EnqueuedTask | Network> {
    return await this.httpRequest.patch({
      path: "network",
      body: options,
      extraRequestInit,
    });
  }

  /**
   * Initialize a network with sharding enabled. This sets up the current
   * instance as the leader and configures the initial set of remotes.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param options - Network initialization options
   * @returns Promise returning the enqueued task
   * @experimental
   */
  initializeNetwork(
    options: InitializeNetworkOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    const shards = this.#validateInitializationShards(
      options.remotes,
      options.shards,
    );

    return this.#patchNetwork(
      {
        self: options.self,
        leader: options.self,
        remotes: options.remotes,
        shards,
      },
      extraRequestInit,
    );
  }

  /**
   * Add a remote to the network. Must be called on the leader instance.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param options - Options containing the remote name and configuration
   * @returns Promise returning the enqueued task
   * @experimental
   */
  addRemote(
    options: AddRemoteOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#patchNetwork(
      {
        remotes: {
          [options.name]: options.remote,
        },
      },
      extraRequestInit,
    );
  }

  /**
   * Remove a remote from the network. Must be called on the leader instance.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param options - Options containing the remote name to remove
   * @returns Promise returning the enqueued task
   * @experimental
   */
  removeRemote(
    options: RemoveRemoteOptions,
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#patchNetwork(
      {
        remotes: {
          [options.name]: null,
        },
      },
      extraRequestInit,
    );
  }

  /**
   * Add remotes to a shard. Must be called on the leader instance.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param shardName - Name of the shard to update
   * @param remotes - Remotes to add
   * @returns Promise returning the enqueued task
   * @experimental
   */
  addRemotesToShard(
    shardName: string,
    remotes: string[],
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#patchNetwork(
      {
        shards: {
          [shardName]: { addRemotes: remotes },
        },
      },
      extraRequestInit,
    );
  }

  /**
   * Remove remotes from a shard. Must be called on the leader instance.
   *
   * {@link https://www.meilisearch.com/docs/reference/api/network#update-the-network-object}
   *
   * @param shardName - Name of the shard to update
   * @param remotes - Remotes to remove
   * @returns Promise returning the enqueued task
   * @experimental
   */
  removeRemotesFromShard(
    shardName: string,
    remotes: string[],
    extraRequestInit?: ExtraRequestInit,
  ): EnqueuedTaskPromise {
    return this.#patchNetwork(
      {
        shards: {
          [shardName]: { removeRemotes: remotes },
        },
      },
      extraRequestInit,
    );
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
  async getKeys(
    parameters?: KeysQuery,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<KeysResults> {
    const keys = await this.httpRequest.get<KeysResults>({
      path: "keys",
      params: parameters,
      extraRequestInit,
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
  async getKey(
    keyOrUid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Key> {
    return await this.httpRequest.get<Key>({
      path: `keys/${keyOrUid}`,
      extraRequestInit,
    });
  }

  /**
   * Create one API key
   *
   * @param options - Key options
   * @returns Promise returning a key
   */
  async createKey(
    options: KeyCreation,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Key> {
    return await this.httpRequest.post<Key>({
      path: "keys",
      body: options,
      extraRequestInit,
    });
  }

  /**
   * Update one API key
   *
   * @param keyOrUid - Key
   * @param options - Key options
   * @returns Promise returning a key
   */
  async updateKey(
    keyOrUid: string,
    options: KeyUpdate,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Key> {
    return await this.httpRequest.patch<Key>({
      path: `keys/${keyOrUid}`,
      body: options,
      extraRequestInit,
    });
  }

  /**
   * Delete one API key
   *
   * @param keyOrUid - Key
   * @returns
   */
  async deleteKey(
    keyOrUid: string,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<void> {
    await this.httpRequest.delete({
      path: `keys/${keyOrUid}`,
      extraRequestInit,
    });
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   *
   * @returns Promise returning an object with health details
   */
  async health(extraRequestInit?: ExtraRequestInit): Promise<Health> {
    return await this.httpRequest.get<Health>({
      path: "health",
      extraRequestInit,
    });
  }

  /**
   * Checks if the server is healthy, return true or false.
   *
   * @returns Promise returning a boolean
   */
  async isHealthy(extraRequestInit?: ExtraRequestInit): Promise<boolean> {
    try {
      const { status } = await this.health(extraRequestInit);
      return status === "available";
    } catch {
      return false;
    }
  }

  ///
  /// STATS
  ///

  /**
   * Get stats of the instance and its indexes
   *
   * Size fields are numbers of bytes by default. `sizeFormat: "human"` returns
   * them as strings with units, such as `"19.64 MiB"`.
   * `showInternalDatabaseSizes` adds each index's internal database sizes.
   *
   * @typeParam Q - Stats query whose `sizeFormat` selects the size field type
   * @param params - Internal database sizes and size formatting
   * @returns Promise containing stats of the instance
   * @see {@link https://www.meilisearch.com/docs/reference/api/stats/get-stats-of-all-indexes}
   */
  async getStats<const Q extends StatsQuery | undefined = undefined>(
    params?: Q,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Stats<Q>> {
    return await this.httpRequest.get<Stats<Q>>({
      path: "stats",
      params,
      extraRequestInit,
    });
  }

  ///
  /// VERSION
  ///

  /**
   * Get the version of Meilisearch
   *
   * @returns Promise returning object with version details
   */
  async getVersion(extraRequestInit?: ExtraRequestInit): Promise<Version> {
    return await this.httpRequest.get<Version>({
      path: "version",
      extraRequestInit,
    });
  }

  ///
  /// DUMPS
  ///

  /**
   * Creates a dump
   *
   * @returns Promise returning object of the enqueued task
   */
  createDump(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "dumps",
      extraRequestInit,
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
  createSnapshot(extraRequestInit?: ExtraRequestInit): EnqueuedTaskPromise {
    return this.#httpRequestsWithTask.post({
      path: "snapshots",
      extraRequestInit,
    });
  }

  ///
  /// RENDER TEMPLATE
  ///

  /**
   * Render a template by injecting the given input.
   *
   * This is an experimental feature. Enable the `renderRoute` experimental
   * feature via {@link Meilisearch.updateExperimentalFeatures} before calling
   * it.
   *
   * @param params - Template/fragment to render and the input to inject
   * @returns Promise returning the unrendered template and the rendered result
   * @experimental
   * @see {@link https://www.meilisearch.com/docs/reference/api/template/render-documents-with-post}
   */
  async renderTemplate(
    params: RenderTemplateParams,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<RenderTemplateResponse> {
    return await this.httpRequest.post<RenderTemplateResponse>({
      path: "render-template",
      body: params,
      extraRequestInit,
    });
  }

  ///
  /// EXPERIMENTAL-FEATURES
  ///

  /** {@link https://www.meilisearch.com/docs/reference/api/experimental_features#get-all-experimental-features} */
  async getExperimentalFeatures(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<RuntimeTogglableFeatures> {
    return await this.httpRequest.get({
      path: "experimental-features",
      extraRequestInit,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/experimental_features#configure-experimental-features} */
  async updateExperimentalFeatures(
    runtimeTogglableFeatures: RuntimeTogglableFeatures,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<RuntimeTogglableFeatures> {
    return await this.httpRequest.patch({
      path: "experimental-features",
      body: runtimeTogglableFeatures,
      extraRequestInit,
    });
  }
}
