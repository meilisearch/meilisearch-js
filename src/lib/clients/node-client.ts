import { Client } from './client'
import { Config, TokenSearchRules, TokenOptions } from '../../types'
import { Token } from '../token'

class MeiliSearch extends Client {
  tokens: Token

  constructor(config: Config) {
    super(config)
  }
}
export { MeiliSearch }
