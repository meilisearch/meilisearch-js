var Meili = require('../dist')

const config = {
  host: 'http://127.0.0.1:7700',
}

var meili = new Meili(config)

meili
  .listIndexes()
  .then((response) => {
    console.log(response)
  })
  .catch((err) => {
    console.error(err)
  })
