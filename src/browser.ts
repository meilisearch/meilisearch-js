export * from './types';
export * from './errors';
export * from './indexes';
import { MeiliSearch } from './clients/browser-client';

export { MeiliSearch, MeiliSearch as Meilisearch };
export default MeiliSearch;
