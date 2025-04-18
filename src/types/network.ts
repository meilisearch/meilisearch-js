/**
 * {@link https://www.meilisearch.com/docs/reference/api/network#the-remote-object}
 *
 * @see `meilisearch_types::features::Remote` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Remote = {
  url: string;
  searchApiKey: string | null;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/network#the-network-object}
 *
 * @see `meilisearch_types::features::Network` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Network = {
  self: string | null;
  remotes: Record<string, Remote>;
};
