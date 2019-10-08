import { Config, Meili } from '../'

test('sample', () => {
  const config: Config = {
    applicationId: '675b1990',
    apiKey: 'f45t6djs2wswgoVJTWmPax72',
  }
  const meili = new Meili(config)
  meili
    .listIndexes()
    .then((response) => {
      expect(response.length).toBe(1)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})
