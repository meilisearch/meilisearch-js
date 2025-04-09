import type { FieldDistribution } from "./types.js";

/** @see `meilisearch::routes::indexes::IndexStats` */
export type IndexStats = {
  numberOfDocuments: number;
  rawDocumentDbSize: number;
  avgDocumentSize: number;
  isIndexing: boolean;
  numberOfEmbeddings?: number;
  numberOfEmbeddedDocuments?: number;
  fieldDistribution: FieldDistribution;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/stats#stats-object}
 *
 * @see `meilisearch::routes::Stats`
 */
export type Stats = {
  databaseSize: number;
  usedDatabaseSize: number;
  lastUpdate: string;
  indexes: Record<string, IndexStats>;
};
