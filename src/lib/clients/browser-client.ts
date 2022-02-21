import { SearchClient } from '..'
import { Config } from '../../types'

class MeiliSearch extends SearchClient {
  constructor(config: Config) {
    super(config)
  }
}

export { MeiliSearch }
