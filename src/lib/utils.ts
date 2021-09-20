import { Config } from "../types"

/**
 * Removes undefined entries from object
 */
function removeUndefinedFromObject(obj: Record<string, any>): object {
  return Object.entries(obj).reduce((acc, curEntry) => {
    const [key, val] = curEntry
    if (val !== undefined) acc[key] = val
    return acc
  }, {} as Record<string, any>)
}

async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

function addProtocolIfNotPresent(config: Config): Config {
  if(!!!(config.host.startsWith('https://')||config.host.startsWith('http://'))){
    let newConfig: Config = {
      ...config,
      host: 'http://' + config.host
    }
    return newConfig;
  }
  return config;
}

export { sleep, removeUndefinedFromObject, addProtocolIfNotPresent }
