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

export { sleep, removeUndefinedFromObject }
