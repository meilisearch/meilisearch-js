export * from "./types/index.js";
export * from "./errors/index.js";
export * from "./indexes.js";
export * from "./task.js";
import { MeiliSearch } from "./meilisearch.js";

/**
 * Default export of {@link MeiliSearch}.
 *
 * @deprecated The default export will be removed in a future version.
 *   {@link https://github.com/meilisearch/meilisearch-js/issues/1789 | Issue}.
 */
const defaultExport = MeiliSearch;

export { MeiliSearch, MeiliSearch as Meilisearch };
export default defaultExport;

// TODO: Write this in PR
// - some classes didnt even cover all of the possible properties
// - we were just creating another object from 80-100% of an existing object
// - why turn them to object dates, when 99% of the users don't ever need those dates
// - what if user wants to turn those dates into a different kind of date object from a different library (lux, temporal)

// - also create a new issue regarding testing and auto generating code samples
