/**
 * {@link https://www.meilisearch.com/docs/reference/api/version#version-object}
 *
 * @see `meilisearch::routes::VersionResponse`
 */
export type VersionResponse = {
  commitSha: string;
  commitDate: string;
  pkgVersion: string;
};
