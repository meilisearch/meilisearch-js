/**
 * {@link https://www.meilisearch.com/docs/reference/api/experimental_features#experimental-features-object}
 *
 * @see `meilisearch::routes::features::RuntimeTogglableFeatures`
 */
export type RuntimeTogglableFeatures = {
  metrics?: boolean | null;
  logsRoute?: boolean | null;
  editDocumentsByFunction?: boolean | null;
  containsFilter?: boolean | null;
  network?: boolean | null;
  getTaskDocumentsRoute?: boolean | null;
  compositeEmbedders?: boolean | null;
};
