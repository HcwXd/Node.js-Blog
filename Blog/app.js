const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, 'public')))

// Session setting
app.use(session({
  name: config.session.key, // Session name = config's key
  secret: config.session.secret, // Use secret parameter to protect signedCookie from being revised
  resave: true, // Refresh session
  saveUninitialized: false, // Generate session even user haven't signed in
  cookie: {
    maxAge: config.session.maxAge // Delete session id when dued
  },
  store: new MongoStore({ // Store session to mongod
    url: config.mongodb
  })
}))
// Use flash middleware to get notification
app.use(flash())

// Use express-formidable to handle uploaded files
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/images'),
  keepExtensions: true // Keep postfix
}))

// Set variables for template
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}

// Add three required variables to the template
app.use(function (req, res, next) {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})

routes(app)

// listen on port number from config file and log the app name from package.json 
app.listen(config.port, function () {
  console.log(`${pkg.name} listening on port ${config.port}`)
})