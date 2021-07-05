import { MeiliSearch, IndexResponse } from '../../../../dist/types/types'

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
  console.log({ indexes }, 'hello')
  const uids = indexes.map((index: IndexResponse) => index.uid)
  document.body.innerHTML = `${greeter(
    user
  )} this is the list of all your indexes: \n ${uids.join(', ')}`
})()
