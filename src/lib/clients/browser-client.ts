import { Client } from './client'
import { Config } from '../../types'

class MeiliSearch extends Client {
  constructor(config: Config) {
    super(config)
  }
}

export { MeiliSearch }
