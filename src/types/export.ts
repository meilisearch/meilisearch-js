import type { Filter } from "./types.js";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/export#indexes}
 *
 * @see `meilisearch::routes::export::ExportIndexSettings`
 */
export type ExportIndexSettings = {
  filter?: Filter;
  overrideSettings?: boolean;
};

/** {@link https://www.meilisearch.com/docs/reference/api/export#indexes} */
export type ExportIndexSettingsRecord = Record<string, ExportIndexSettings>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/export#body}
 *
 * @see `meilisearch::routes::export::Export`
 */
export type ExportOptions = {
  /** {@link https://www.meilisearch.com/docs/reference/api/export#url} */
  url: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/export#apikey} */
  apiKey?: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/export#payloadsize} */
  payloadSize?: string;
  /** {@link https://www.meilisearch.com/docs/reference/api/export#indexes} */
  indexes?: ExportIndexSettingsRecord;
};
