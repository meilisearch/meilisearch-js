import MeiliSearch, { IndexResponse } from '../../../../'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)

;(async () => {
  const indexes = await client.listIndexes()
  indexes.map((index: IndexResponse) => index.uid)
})()
