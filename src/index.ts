export * from './types';
export * from './errors';
export * from './indexes';
export * from './enqueued-task';
export * from './task';
import { MeiliSearch } from './clients/node-client';

export { MeiliSearch, MeiliSearch as Meilisearch };
export default MeiliSearch;
