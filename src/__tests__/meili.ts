import Meili from '../'

const config = {
  host: 'http://127.0.0.1:7700',
}

const wrongConfig = {
  host: 'http://127.0.0.1:1234',
}
// TODO: do test with two meili servers, one with api key one without
const meili = new Meili(config)
const wrongMeili = new Meili(wrongConfig)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

test('Health', async() => {
  await expect(meili.setHealthy()).resolves.toBe("");
  await expect(wrongMeili.isHealthy()).rejects.toThrow();
  await expect(meili.isHealthy()).resolves.toBe(true);
  await expect(meili.setUnhealthy()).resolves.toBe("");
  await expect(meili.isHealthy()).rejects.toThrow();
  await expect(meili.setHealthy()).resolves.toBe("");
  await expect(meili.isHealthy()).resolves.toBe(true);
  await expect(meili.changeHealthTo(false)).resolves.toBe("");
  await expect(meili.isHealthy()).rejects.toThrow();
  await expect(meili.setHealthy()).resolves.toBe("");
})

test('System information', async () => {
  await meili.systemInformation().catch((err) => {
    expect(err).toBe(null)
  })

  await meili.systemInformationPretty().catch((err) => {
    expect(err).toBe(null)
  })
})

test('Version', async () => {
  await meili.version().catch((err) => {
    expect(err).toBe(null)
  })
})

test('Database stats', async () => {
  await meili.databaseStats().catch((err) => {
    expect(err).toBe(null)
  })
})

// test('reset-start', async () => {
//   await clearAllIndexes()
// })



// test('admin', async () => {
//   await meili.databaseStats().catch((err) => {
//     expect(err).toBe(null)
//   })

//   await meili.version().catch((err) => {
//     expect(err).toBe(null)
//   })

//   await meili.systemInformation().catch((err) => {
//     expect(err).toBe(null)
//   })

//   await meili.systemInformationPretty().catch((err) => {
//     expect(err).toBe(null)
//   })

//   await meili.isHealthy().catch((err) => {
//     expect(err).toBe(null)
//   })
// })

// test('create-index-with-name', async () => {
//   const index = {
//     name: 'ABABABABA',
//   }

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(0)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .createIndex(index)
//     .then((response: any) => {
//       expect(response.name).toBe(index.name)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(1)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .createIndex(index)
//     .then((response: any) => {
//       expect(response.name).toBe(index.name)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(2)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await clearAllIndexes()
// })

// test('create-index-with-uid', async () => {
//   const index = {
//     name: 'ABABABABA',
//     uid: 'abababa',
//   }

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(0)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .createIndex(index)
//     .then((response: any) => {
//       expect(response.name).toBe(index.name)
//       expect(response.uid).toBe(index.uid)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(1)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await meili
//     .createIndex(index)
//     .then((response: any) => {
//       expect(response).toBe(null)
//     })
//     .catch((err) => {
//       expect(err.response.status).toBe(400)
//     })

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(1)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await clearAllIndexes()
// })

// test('reset-end', async () => {
//   await clearAllIndexes()
// })

// const clearAllIndexes = async () => {
//   let indexes = await meili
//     .listIndexes()
//     .then((response: any) => {
//       return response.map((elem: any) => elem.uid)
//     })
//     .catch((err) => {
//       console.log(err.code);

//       expect(err).toBe(null)
//     })

//   for (let indexUid of indexes) {
//     await meili
//       .Index(indexUid)
//       .deleteIndex()
//       .catch((err) => {
//         expect(err).toBe(null)
//       })
//   }

//   await meili
//     .listIndexes()
//     .then((response: any) => {
//       expect(response.length).toBe(0)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })
// }
