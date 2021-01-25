import { MeiliSearch, IndexResponse } from '../../../'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const user = 'MeiliSearch User'

function greeter(person: string) {
  return 'Hello, ' + person
}

;(async () => {
  const indexes = await client.listIndexes()
  const uids = indexes.map((index: IndexResponse) => index.uid)
  console.log(
    `${greeter(user)} this is the list of all your indexes: ${uids.join(', ')}`
  )
})()
