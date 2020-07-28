function removeUndefinedFromObject(object: Record<string, any>): object {
  return Object.keys(object).reduce((acc: Record<string, any>, key: string) => {
    if (object[key] !== undefined) {
      acc[key] = object[key]
    }
    return acc
  }, {})
}

async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

export { sleep, removeUndefinedFromObject }
