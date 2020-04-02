import MeiliSearch from '../src'
import * as Types from '../src/types'
import { types } from '@babel/core'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: '123',
}

// TODO: do test with two meili servers, one with api key one without
const client = new MeiliSearch(config)

const clearAllIndexes = async () => {
  const indexes = await client
    .listIndexes()
    .then((response: Types.IndexResponse[]): string[] => {
      return response.map((elem: Types.IndexResponse) => elem.uid)
    })

  for (const indexUid of indexes) {
    await client
      .getIndex(indexUid)
      .deleteIndex()
      .catch((err) => {
        expect(err).toBe(null)
      })
  }

  await expect(client.listIndexes()).resolves.toHaveLength(0)
}

test('connexion without API key', () => {
  const meiliNoApi = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
  })
  expect(meiliNoApi).toBeInstanceOf(MeiliSearch)
})

test('connexion with API key', () => {
  const meiliApi = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: '123',
  })
  expect(meiliApi).toBeInstanceOf(MeiliSearch)
})

test('get different keys', async () => {
  await client.getKeys().then((response: Types.Keys) => {
    expect(response).toHaveProperty('public', expect.any(String))
    expect(response).toHaveProperty('private', expect.any(String))
  })
})

test('health', async () => {
  await expect(client.setHealthy()).resolves.toBe('')
  await expect(client.isHealthy()).resolves.toBe(true)
  await expect(client.setUnhealthy()).resolves.toBe('')
  await expect(client.isHealthy()).rejects.toThrow()
  await expect(client.setHealthy()).resolves.toBe('')
  await expect(client.isHealthy()).resolves.toBe(true)
  await expect(client.changeHealthTo(false)).resolves.toBe('')
  await expect(client.isHealthy()).rejects.toThrow()
  await expect(client.setHealthy()).resolves.toBe('')
})

test('system information', async () => {
  await client.sysInfo().then((response: Types.SysInfo) => {
    expect(response).toHaveProperty('memoryUsage', expect.any(Number))
    expect(response).toHaveProperty('processorUsage', expect.any(Array))
    expect(response.global).toHaveProperty('totalMemory', expect.any(Number))
    expect(response.global).toHaveProperty('usedMemory', expect.any(Number))
    expect(response.global).toHaveProperty('totalSwap', expect.any(Number))
    expect(response.global).toHaveProperty('usedSwap', expect.any(Number))
    expect(response.global).toHaveProperty('inputData', expect.any(Number))
    expect(response.global).toHaveProperty('outputData', expect.any(Number))
    expect(response.process).toHaveProperty('memory', expect.any(Number))
    expect(response.process).toHaveProperty('cpu', expect.any(Number))
  })
  await client.prettySysInfo().then((response: Types.SysInfoPretty) => {
    expect(response).toHaveProperty('memoryUsage', expect.any(String))
    expect(response).toHaveProperty('processorUsage', expect.any(Array))
    expect(response.global).toHaveProperty('totalMemory', expect.any(String))
    expect(response.global).toHaveProperty('usedMemory', expect.any(String))
    expect(response.global).toHaveProperty('totalSwap', expect.any(String))
    expect(response.global).toHaveProperty('usedSwap', expect.any(String))
    expect(response.global).toHaveProperty('inputData', expect.any(String))
    expect(response.global).toHaveProperty('outputData', expect.any(String))
    expect(response.process).toHaveProperty('memory', expect.any(String))
    expect(response.process).toHaveProperty('cpu', expect.any(String))
  })
})

test('Version', async () => {
  await client.version().then((response: Types.Version) => {
    expect(response).toHaveProperty('commitSha', expect.any(String))
    expect(response).toHaveProperty('buildDate', expect.any(String))
    expect(response).toHaveProperty('pkgVersion', expect.any(String))
  })
})

test('Database stats', async () => {
  await client.stats().then((response: Types.Stats) => {
    expect(response).toHaveProperty('databaseSize', expect.any(Number))
    expect(response).toHaveProperty('lastUpdate', expect.any(String))
    expect(response).toHaveProperty('indexes', expect.any(Object))
  })
})

test('reset-start', async () => {
  await clearAllIndexes()
})

test('create-index-with-uid', async () => {
  const index = {
    uid: 'random_uid_1',
  }
  const indexIndentifier = {
    uid: 'random_uid_2',
    primaryKey: 'movie_id',
  }
  const noUid = {
    uid: '',
  }

  await expect(client.listIndexes()).resolves.toHaveLength(0)

  await client.createIndex(index).then((response: Types.IndexResponse) => {
    expect(response.uid).toBe(index.uid)
  })

  await expect(client.listIndexes()).resolves.toHaveLength(1)
  await expect(client.createIndex(index)).rejects.toThrow()
  await expect(client.listIndexes()).resolves.toHaveLength(1)
  await expect(client.createIndex(noUid)).rejects.toThrow()
  await client
    .createIndex(indexIndentifier)
    .then((response: Types.IndexResponse) => {
      expect(response.uid).toBe(indexIndentifier.uid)
    })

  await expect(client.listIndexes()).resolves.toHaveLength(2)
  await clearAllIndexes()
})

test('reset-end', async () => {
  await clearAllIndexes()
})
