const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const errorHandler = require('errorhandler')

module.exports = (() => {
  const app = express()
  const path = require('path')
  const port = process.env.PORT || 3040
  const staticify = require('staticify')(path.join(__dirname, 'public'))

  app.set('port', port)

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'pug')
  app.locals.basedir = app.get('views')

  app.use(logger('dev'))

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  app.use(methodOverride())

  app.use(express.static(path.join(__dirname, 'public')))

  app.use(errorHandler())

  app.use(staticify.middleware)
  app.locals.getVersionedPath = staticify.getVersionedPath

  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
  })

  return app
})()
