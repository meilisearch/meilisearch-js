import { Config } from '../types';
import { Client } from './client';

class MeiliSearch extends Client {
  constructor(config: Config) {
    super(config);
  }
}

export { MeiliSearch };
