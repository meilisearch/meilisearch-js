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

function addProtocolIfNotPresent(host: string): string {
  if (!(host.startsWith('https://') || host.startsWith('http://'))) {
    return `http://${host}`
  }
  return host
}

function addTrailingSlash(url: string): string {
  if (!url.endsWith('/')) {
    url += '/'
  }
  return url
}

function validateUuid4(uuid: string): boolean {
  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
  return regexExp.test(uuid)
}

export {
  sleep,
  removeUndefinedFromObject,
  addProtocolIfNotPresent,
  addTrailingSlash,
  validateUuid4,
}
