async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

function joinIfArray(params: string | string[]): string {
  if (Array.isArray(params)) return params.join(',')
  else return params
}

function createArrayIfString(params: string | string[]): string[] {
  if (Array.isArray(params)) return params
  else return [params]
}

export { sleep, joinIfArray, createArrayIfString }
