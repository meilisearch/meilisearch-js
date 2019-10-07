/*
 * Bundle: Meili / Keys
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import { AxiosInstance } from 'axios'

interface KeysConfig {
  baseURL: string
  apiKey: string
}

class Keys {
  instance: AxiosInstance

  constructor(instance: AxiosInstance) {
    this.instance = instance
  }
}

export { Keys, KeysConfig }
