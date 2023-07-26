require('dotenv').config()

const Prismic = require('@prismicio/client')
const PrismicH = require('@prismicio/helpers')
const UAParser = require('ua-parser-js')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const app = require('./config')

// Initialize the prismic.io api
const initApi = (req) => {
  return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch
  })
}

// Link Resolver
const HandleLinkResolver = (doc) => {
  if (doc.type === 'about') {
    return '/about'
  }

  // Default to homepage
  return '/'
}

// Middleware to inject prismic context
app.use((req, res, next) => {
  const ua = UAParser(req.headers['user-agent'])

  res.locals.isAJAX = req.headers['x-requested-with'] === 'XMLHttpRequest'
  res.locals.isDesktop = ua.device.type === undefined
  res.locals.isPhone = ua.device.type === 'mobile'
  res.locals.isTablet = ua.device.type === 'tablet'

  res.locals.Link = HandleLinkResolver
  res.locals.PrismicH = PrismicH
  res.locals.Numbers = (index) => {
    return index === 0 ? 'One' : index === 1 ? 'Two' : index === 2 ? 'Three' : index === 3 ? 'Four' : ''
  }

  next()
})

const handleRequest = async (api) => {
  const [meta, preloader, navigation, home, about] =
    await Promise.all([
      api.getSingle('meta'),
      api.getSingle('preloader'),
      api.getSingle('navigation'),
      api.getSingle('home'),
      api.getSingle('about')
    ])

  const assets = []

  home.data.gallery.forEach((item) => {
    assets.push(item.poster.url)
  })

  about.data.body.forEach((section) => {
    if (section.slice_type === 'gallery') {
      section.items.forEach((item) => {
        assets.push(item.image.url)
      })
    }
  })

  return {
    meta,
    preloader,
    navigation,
    home,
    about
  }
}

app.get('/', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)

  res.render('pages/home', {
    ...defaults
  })
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)

  res.render('pages/about', {
    ...defaults
  })
})

app.use((request, response) => {
  response.status(404)

  if (request.accepts('html')) {
    return response.redirect('/')
  }

  if (request.accepts('json')) {
    return response.send({ error: 'Not Found' })
  }

  response.type('txt').send('Not Found')
})
