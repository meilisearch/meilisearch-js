import { Config } from '../types'
import { Client } from './client'
import { PACKAGE_VERSION } from '../package-version'

class MeiliSearch extends Client {
  constructor(config: Config) {
    super({
      ...config,
      clientAgents: [
        ...(config.clientAgents ?? []),
        `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
      ],
    })
  }
}

export { MeiliSearch }
