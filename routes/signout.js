const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin


router.get('/', checkLogin, function (req, res, next) {
    req.session.user = null
    req.flash('success', 'Sign out successfully')
    res.redirect('/posts')
})

module.exports = router