/** {@link https://www.meilisearch.com/docs/reference/api/network#the-remote-object} */
export type Remote = {
  url: string;
  searchApiKey?: string | null;
  writeApiKey?: string | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/network#the-network-object} */
export type Network = {
  self?: string | null;
  leader?: string | null;
  version?: string | null;
  remotes?: Record<string, Remote | null>;
  shards?: Record<string, Shard>;
};

export type Shard = {
  remotes: string[];
};

export type ShardUpdate = {
  remotes?: string[];
  addRemotes?: string[];
  removeRemotes?: string[];
};

/** Options for initializing a network with sharding enabled. */
export type InitializeNetworkOptions = {
  self: string;
  remotes: Record<string, Remote>;
  shards: Record<string, ShardInitialization>;
};

/** Options for adding a remote to an existing network. */
export type AddRemoteOptions = {
  name: string;
  remote: Remote;
};

/** Options for removing a remote from an existing network. */
export type RemoveRemoteOptions = {
  name: string;
};

export type ShardInitialization = {
  remotes: [string, ...string[]];
};

export type UpdateNetworkOptions = {
  self?: string;
  leader?: string | null;
  remotes?: Record<string, Remote | null>;
  shards?: Record<string, ShardUpdate>;
};
