const UMDMeiliSearch = require('./meilisearch.umd')

const UMDtest = new UMDMeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
console.log({ UMDtest })
