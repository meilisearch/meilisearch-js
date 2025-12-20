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
};

/** Options for initializing a network with sharding enabled. */
export type InitializeNetworkOptions = {
  self: string;
  remotes: Record<string, Remote>;
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
