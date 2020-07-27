function removeUndefinedFromObject(obj: object): object {
  // remove undefined
  const cleaned = Object.entries(obj).filter((x) => x[1] !== undefined)
  return Object.fromEntries(cleaned)
}

async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

export { sleep, removeUndefinedFromObject }
