const express = require('express')
const app = express()
const router = express.Router()

console.log(process.cwd())
router.get('/', function (req, res) {
  res.sendFile(`${process.cwd()}/public/index.html`)
})
app.use(express.static('public'))
// add the router
app.use('/', router)
app.listen(process.env.port || 3000)

console.log('Running at Port 3000')
