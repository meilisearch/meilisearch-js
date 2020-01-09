import Meili from '../'
import dataset from '../../examples/small_movies.json'

const config = {
  host: 'http://127.0.0.1:7700',
}

const meili = new Meili(config)

const index = {
  name: 'Movies',
  uid: 'movies',
}

const schema = {
  identifier: 'id',
  attributes: {
    id: {
      displayed: true,
      indexed: true,
      ranked: false,
    },
    title: {
      displayed: true,
      indexed: true,
      ranked: false,
    },
    poster: {
      displayed: true,
      indexed: true,
      ranked: false,
    },
    overview: {
      displayed: true,
      indexed: true,
      ranked: false,
    },
    release_date: {
      displayed: true,
      indexed: true,
      ranked: false,
    },
  },
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
// jest.setTimeout(15 * 1000)

///
/// INDEXES
///

test('create-index', async () => {
  await meili
    .createIndex(index)
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})

test('get-index', async () => {
  await meili
    .Index(index.uid)
    .getIndex()
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
})


test('update-index', async () => {
  await meili
  .Index(index.uid)
  .updateIndex({ name: 'new name' })
  .then((response: any) => {
    expect(response.name).toBe('new name')
    expect(response.uid).toBe(index.uid)
  })
  .catch((err) => {
    expect(err).toBe(null)
  })
  await meili
    .Index(index.uid)
    .getIndex()
    .then((response: any) => {
      expect(response.name).toBe('new name')
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await meili
    .Index(index.uid)
    .updateIndex({ name: index.name })
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})



///
/// SCHEMA
///
test('update-schema', async () => {
    await meili
      .Index(index.uid)
      .updateSchema({
        'id': ['indexed','displayed','identifier'],
        'title':['displayed','indexed'],
        'poster':['displayed','indexed'],
        'overview':['indexed','displayed'],
        'release_date':['indexed','displayed']
      }).then((response: any) => {
        expect(response).toHaveProperty('updateId')
      })
      .catch((err) => {
        expect(err).toBe(null)
      })

})

test('get-schema', async () => {
  await meili
    .Index(index.uid)
    .getSchema()
    .then((response: any) => {
      expect(response)
      .toBeDefined()
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})


// test('add-documents', async () => {
//   await meili
//     .Index(index.uid)
//     .addDocuments(dataset)
//     .then((response: any) => {
//       expect(response.updateId).toBeDefined()
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })
// })

// test('get-document', async () => {
//   await sleep(3 * 1000)
//   await meili
//     .Index(index.uid)
//     .getDocument('287947')
//     .then((response: any) => {
//       expect(response).toEqual(dataset[0])
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })
// })

test('delete-index', async () => {
  await meili
    .Index(index.uid)
    .deleteIndex()
    .then((response: any) => {
      expect(response)
      .toBeDefined()
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
    await meili
    .listIndexes()
    .then((response: any) => {
      expect(response.length).toBe(0)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})



test('reset-stop', async () => {
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
})
