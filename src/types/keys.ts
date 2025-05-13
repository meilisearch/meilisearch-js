type ALL = "*";
type GET = "get";
type CREATE = "create";
type UPDATE = "update";
type DELETE = "delete";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/keys#actions}
 *
 * @see `meilisearch_types::keys::Action`
 */
export type Action =
  | ALL
  | "search"
  | `documents.${ALL | "add" | GET | DELETE}`
  | `indexes.${ALL | CREATE | GET | UPDATE | DELETE | "swap"}`
  | `tasks.${ALL | "cancel" | DELETE | GET}`
  | `settings.${ALL | GET | UPDATE}`
  | `stats.${GET}`
  | `metrics.${GET}`
  | `dumps.${CREATE}`
  | `snapshots.${CREATE}`
  | "version"
  | `keys.${CREATE | GET | UPDATE | DELETE}`
  | `experimental.${GET | UPDATE}`
  | `network.${GET | UPDATE}`;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/keys#body}
 *
 * @see `meilisearch_types::keys::CreateApiKey`
 */
export type CreateApiKey = {
  description?: string | null;
  name?: string | null;
  uid?: string;
  actions: Action[];
  indexes: string[];
  expiresAt: string | null;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/keys#key-object}
 *
 * @see `meilisearch::routes::api_key::KeyView`
 */
export type KeyView = {
  name: string | null;
  description: string | null;
  key: string;
  uid: string;
  actions: Action[];
  indexes: string[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/keys#query-parameters}
 *
 * @see `meilisearch::routes::api_key::ListApiKeys`
 */
export type ListApiKeys = {
  offset?: number;
  limit?: number;
};

/** @see `meilisearch::routes::PaginationView` */
export type PaginationView<T> = {
  results: T[];
  offset: number;
  limit: number;
  total: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/keys#response} */
export type KeyViewList = PaginationView<KeyView>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/keys#body-1}
 *
 * @see `meilisearch_types::keys::PatchApiKey`
 */
export type PatchApiKey = {
  description?: string | null;
  name?: string | null;
};
