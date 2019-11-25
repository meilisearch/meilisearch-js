import Meili from '../'

const config = {
  host: 'http://127.0.0.1:8080',
}

const meili = new Meili(config)

const clearAllIndexes = async () => {
  let indexes = await meili
    .listIndexes()
    .then((response: any) => {
      return response.map((elem: any) => elem.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  for (let indexUid of indexes) {
    await meili
      .Index(indexUid)
      .deleteIndex()
      .catch((err) => {
        expect(err).toBe(null)
      })
  }

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(0)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
}

test('reset-start', async () => {
  await clearAllIndexes()
})

test('health', async () => {
  await meili.setHealthy().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.isHealthy().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.setUnhealthy().catch((err) => {
    expect(err).toBe(null)
  })

  try {
    await meili.isHealthy().then((response) => {
      expect(response).toBe(null)
    })
  } catch (_) {}

  await meili.setHealthy().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.isHealthy().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.changeHealthTo(false).catch((err) => {
    expect(err).toBe(null)
  })

  try {
    await meili.isHealthy().then((response) => {
      expect(response).toBe(null)
    })
  } catch (_) {}

  await meili.changeHealthTo(true).catch((err) => {
    expect(err).toBe(null)
  })

  await meili.isHealthy().catch((err) => {
    expect(err).toBe(null)
  })
})

test('admin', async () => {
  await meili.databaseStats().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.version().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.systemInformation().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.systemInformationPretty().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.isHealthy().catch((err) => {
    expect(err).toBe(null)
  })
})

test('create-index-with-name', async () => {
  const index = {
    name: 'ABABABABA',
  }

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(0)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response.name).toBe(index.name)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(1)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response.name).toBe(index.name)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(2)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await clearAllIndexes()
})

test('create-index-with-uid', async () => {
  const index = {
    name: 'ABABABABA',
    uid: 'abababa',
  }

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(0)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(1)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response).toBe(null)
    })
    .catch((err) => {
      expect(err.response.status).toBe(400)
    })

  await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(1)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await clearAllIndexes()
})

test('reset-end', async () => {
  await clearAllIndexes()
})
