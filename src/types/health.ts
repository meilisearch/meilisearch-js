/** @see `meilisearch::routes::HealthStatus` */
export type HealthStatus = "available";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/health#response-200-ok}
 *
 * @see `meilisearch::routes::HealthResponse`
 */
export type HealthResponse = { status: HealthStatus };
