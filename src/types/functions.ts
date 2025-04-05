import type { ExtraRequestInit } from "./http-requests.js";
import type {
  FederatedSearch,
  MultiSearch,
  Pagination,
  SearchQuery,
} from "./search-parameters.js";
import type {
  FederatedSearchResult,
  SearchResults,
  SearchResultWithOffsetLimit,
  SearchResultWithPagination,
} from "./search-response.js";
import type { RecordAny } from "./shared.js";

export type MultiSearchFn = <T extends RecordAny>(
  queries: MultiSearch,
  init?: ExtraRequestInit,
) => Promise<SearchResults<T>>;

export type FederatedSearchFn = <T extends RecordAny>(
  queries: FederatedSearch,
  init?: ExtraRequestInit,
) => Promise<FederatedSearchResult<T>>;

export type ConditionalSearchResult<
  T extends SearchQuery,
  U extends RecordAny = RecordAny,
> = T extends Pagination
  ? SearchResultWithPagination<U>
  : SearchResultWithOffsetLimit<U>;
