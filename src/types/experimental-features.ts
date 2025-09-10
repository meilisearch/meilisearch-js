/**
 * {@link https://www.meilisearch.com/docs/reference/api/experimental_features#experimental-features-object}
 *
 * @see `meilisearch::routes::features::RuntimeTogglableFeatures`
 */
export type RuntimeTogglableFeatures = {
  chatCompletions?: boolean | null;
  compositeEmbedders?: boolean | null;
  containsFilter?: boolean | null;
  editDocumentsByFunction?: boolean | null;
  getTaskDocumentsRoute?: boolean | null;
  logsRoute?: boolean | null;
  metrics?: boolean | null;
  multimodal?: boolean | null;
  network?: boolean | null;
};
