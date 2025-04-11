import type { Pagination, SearchQuery } from "./search-parameters.js";
import type {
  SearchResultWithOffsetLimit,
  SearchResultWithPagination,
} from "./search-response.js";
import type { RecordAny } from "./shared.js";

export type ConditionalSearchResult<
  T extends SearchQuery,
  U extends RecordAny = RecordAny,
> = T extends Pagination
  ? SearchResultWithPagination<U>
  : SearchResultWithOffsetLimit<U>;
