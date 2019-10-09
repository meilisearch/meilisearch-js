var Meili = require('../dist')

var config = {
  applicationId: '675b1990',
  apiKey: 'f45t6djs2wswgoVJTWmPax72',
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
