/*
 * Bundle: Meili / Admin
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import { AxiosInstance } from 'axios'

interface AdminConfig {
  baseURL: string
  apiKey: string
}

class Admin {
  instance: AxiosInstance

  constructor(instance: AxiosInstance) {
    this.instance = instance
  }

  /**
   * Will make a backup and respond 200 when the backup is succeeded. Used to rollout restart into the k8s cluser.
   * @memberof Admin
   * @method prepareRollout
   */
  prepareRollout(): Promise<void> {
    const url = '/prepare/rollout'

    return this.instance.put(url)
  }

  /**
   * Check if the server is healhty
   * @memberof Admin
   * @method isHealthy
   */
  isHealthy(): Promise<void> {
    const url = '/health'

    return this.instance.get(url)
  }

  /**
   * Changer the healthyness to healthy
   * @memberof Admin
   * @method setHealthy
   */
  setHealthy(): Promise<void> {
    const url = '/health'

    return this.instance.post(url)
  }

  /**
   * Changer the healthyness to unhealthy
   * @memberof Admin
   * @method setUnhealthy
   */
  setUnhealthy(): Promise<void> {
    const url = '/health'

    return this.instance.delete(url)
  }

  /**
   * Changer the healthyness to unhealthy
   * @memberof Admin
   * @method setUnhealthy
   */
  changeHealthTo(health: boolean): Promise<void> {
    const url = '/health'

    return this.instance.put(url, {
      health,
    })
  }

  /**
   * Get the stats of all the database
   * @memberof Admin
   * @method databaseStats
   */
  databaseStats(): Promise<object> {
    const url = '/stats'

    return this.instance.get(url)
  }

  /**
   * Get the stats of on index
   * @memberof Admin
   * @method indexStats
   */
  indexStats(indexId: string): Promise<object> {
    const url = `/stats/${indexId}`

    return this.instance.get(url)
  }

  /**
   * Get the version of the server
   * @memberof Admin
   * @method version
   */
  version(): Promise<object> {
    const url = '/version'

    return this.instance.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network
   * @memberof Admin
   * @method systemInformation
   */
  systemInformation(): Promise<object> {
    const url = '/sys-info'

    return this.instance.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network. All information as human readable
   * @memberof Admin
   * @method systemInformationPretty
   */
  systemInformationPretty(): Promise<object> {
    const url = '/sys-info/pretty'

    return this.instance.get(url)
  }
}

export { Admin, AdminConfig }
