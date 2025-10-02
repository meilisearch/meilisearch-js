import type { DeepPartial } from "./shared.js";

/** {@link https://www.meilisearch.com/docs/reference/api/network#the-remote-object} */
export type Remote = {
  url: string;
  searchApiKey?: string | null;
  writeApiKey?: string | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/network#the-network-object} */
export type Network = {
  self?: string | null;
  remotes?: Record<string, Remote>;
  sharding?: boolean;
};

export type UpdatableNetwork = DeepPartial<Network>;
