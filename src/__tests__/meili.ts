import Meili from '../'

const config = {
  host: 'http://127.0.0.1:7700',
}

// TODO: do test with two meili servers, one with api key one without
const meili = new Meili(config)

const clearAllIndexes = async () => {
  const indexes = await meili
    .listIndexes()
    .then((response: any) => {
      return response.map((elem: any) => elem.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  for (const indexUid of indexes) {
    await meili
      .Index(indexUid)
      .deleteIndex()
      .catch((err) => {
        expect(err).toBe(null)
      })
  }

  await expect(meili.listIndexes())
    .resolves
    .toHaveLength(0);
}

test('connexion without API key', () => {
  const meiliNoApi = new Meili({
    host: 'http://127.0.0.1:7700',
  })
  expect(meiliNoApi).toBeInstanceOf(Meili);
})

test('connexion with API key', () => {
  const meiliApi = new Meili({
    host: 'http://127.0.0.1:7700',
    apiKey: '123'
  })
  expect(meiliApi).toBeInstanceOf(Meili);
})

test('health', async() => {
  await expect(meili.setHealthy()).resolves.toBe("");
  await expect(meili.isHealthy()).resolves.toBe(true);
  await expect(meili.setUnhealthy()).resolves.toBe("");
  await expect(meili.isHealthy()).rejects.toThrow();
  await expect(meili.setHealthy()).resolves.toBe("");
  await expect(meili.isHealthy()).resolves.toBe(true);
  await expect(meili.changeHealthTo(false)).resolves.toBe("");
  await expect(meili.isHealthy()).rejects.toThrow();
  await expect(meili.setHealthy()).resolves.toBe("");
})

test('system information', async () => {
  await expect(meili.systemInformation()).resolves.toBeDefined();
  await expect(meili.systemInformationPretty()).resolves.toBeDefined();
})

test('Version', async () => {
  await expect(meili.version()).resolves.toBeDefined();
})

test('Database stats', async () => {
  await expect(meili.databaseStats()).resolves.toBeDefined();
})

test('reset-start', async () => {
  await clearAllIndexes()
})


test('create-index-with-name', async () => {
  const index = {
    name: 'ABABABABA',
  }
  await expect(meili.listIndexes())
  .resolves
  .toHaveLength(0);

  await expect(meili.createIndex(index))
    .resolves
    .toHaveProperty('name', index.name);

  await expect(meili.listIndexes())
    .resolves
    .toHaveLength(1);

  await expect(meili.createIndex(index))
    .resolves
    .toHaveProperty('name', index.name);

  await expect(meili.listIndexes())
    .resolves
    .toHaveLength(2);

  await clearAllIndexes()
})

test('create-index-with-uid', async () => {
  const index = {
    name: 'ABABABABA',
    uid: 'abababa',
  }

  await expect(meili.listIndexes())
    .resolves
    .toHaveLength(0);

  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await expect(meili.listIndexes())
      .resolves
      .toHaveLength(1);

  await expect(meili.createIndex(index))
    .rejects
    .toThrow()

  await expect(meili.listIndexes())
    .resolves
    .toHaveLength(1);

  await clearAllIndexes()
})

test('reset-end', async () => {
  await clearAllIndexes()
})
