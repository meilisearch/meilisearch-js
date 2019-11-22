import Meili from '../'

test('sample', async () => {
  const config = {
    host: 'http://127.0.0.1:8080',
  }
  const meili = new Meili(config)
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
        console.log(err)
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
