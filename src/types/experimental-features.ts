type ExperimentalFeatureNames =
  | "chatCompletions"
  | "compositeEmbedders"
  | "containsFilter"
  | "editDocumentsByFunction"
  | "getTaskDocumentsRoute"
  | "logsRoute"
  | "metrics"
  | "multimodal"
  | "network"
  | "vectorStoreSetting";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/experimental_features#experimental-features-object}
 *
 * @see `meilisearch::routes::features::RuntimeTogglableFeatures`
 */
export type RuntimeTogglableFeatures = {
  [Name in ExperimentalFeatureNames]?: boolean | null;
};
