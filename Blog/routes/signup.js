const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

// GET /signup
router.get('/', checkNotLogin, function (req, res, next) {
    res.render('signup')
})
// POST /signup
router.post('/', checkNotLogin, function (req, res, next) {

    const name = req.fields.name
    const gender = req.fields.gender
    const bio = req.fields.bio
    const avatar = req.files.avatar.path.split(path.sep).pop()
    console.log(avatar)
    let password = req.fields.password
    const repassword = req.fields.repassword

    // Examination
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('Username must longer than 1, shorter than 10')
        }
        if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('Only m, f, x are available')
        }
        if (!(bio.length >= 1 && bio.length <= 30)) {
            throw new Error('Bio must longer than 1, shorter than 30')
        }
        if (!req.files.avatar.name) {
            throw new Error('No avatar find')
        }
        if (password.length < 6) {
            throw new Error('Password must longer than 6')
        }
        if (password !== repassword) {
            throw new Error('Password confirmed is inconsistent')
        }
    } catch (e) {
        // Fail to signup
        fs.unlink(req.files.avatar.path)
        req.flash('error', e.message)
        return res.redirect('/signup')
    }

    // encrypt password
    password = sha1(password)

    let user = {
        name: name,
        password: password,
        gender: gender,
        bio: bio,
        avatar: avatar
    }
    // Write User date to the mongodb
    UserModel.create(user)
        .then(function (result) {

            user = result.ops[0]

            delete user.password
            req.session.user = user

            req.flash('success', 'Sign up successfully')

            res.redirect('/posts')
        })
        .catch(function (e) {

            fs.unlink(req.files.avatar.path)

            if (e.message.match('duplicate key')) {
                req.flash('error', 'Username have been used')
                return res.redirect('/signup')
            }
            next(e)
        })
})

module.exports = router