import type { PaginationView } from "./shared.js";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/indexes#query-parameters}
 *
 * @see `meilisearch::routes::indexes::ListIndexes`
 */
export type ListIndexes = {
  offset?: number;
  limit?: number;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/indexes#index-object}
 *
 * @see `meilisearch::routes::indexes::IndexView`
 */
export type IndexView = {
  uid: string;
  createdAt: string;
  updatedAt: string;
  primaryKey: string | null;
};

/** {@link https://www.meilisearch.com/docs/reference/api/indexes#response} */
export type IndexViewList = PaginationView<IndexView>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/indexes#body-1}
 *
 * @see `meilisearch::routes::indexes::UpdateIndexRequest`
 */
export type UpdateIndexRequest = { primaryKey?: string | null };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/indexes#body}
 *
 * @see `meilisearch::routes::indexes::IndexCreateRequest`
 */
export type IndexCreateRequest = UpdateIndexRequest & { uid: string };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/indexes#body-2}
 *
 * @see `meilisearch::routes::swap_indexes::SwapIndexesPayload`
 */
export type SwapIndexesPayload = { indexes: [string, string] };
