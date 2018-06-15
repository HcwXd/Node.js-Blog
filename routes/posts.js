const express = require('express')
const router = express.Router()
const PostModel = require('../models/posts')
const CommentModel = require('../models/comments')



const checkLogin = require('../middlewares/check').checkLogin

// GET /posts
//   eg: GET /posts?author=xxx
router.get('/', function (req, res, next) {
    const author = req.query.author

    PostModel.getPosts(author)
        .then(function (posts) {
            res.render('posts', {
                posts: posts
            })
        })
        .catch(next)
})

// POST /posts/create 
router.post('/create', checkLogin, function (req, res, next) {
    const author = req.session.user._id
    const title = req.fields.title
    const content = req.fields.content

    // Examination
    try {
        if (!title.length) {
            throw new Error('Please input your title')
        }
        if (!content.length) {
            throw new Error('Please input your content')
        }
    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('back')
    }

    let post = {
        author: author,
        title: title,
        content: content
    }

    PostModel.create(post)
        .then(function (result) {

            post = result.ops[0]
            req.flash('success', 'Publish successfully')

            res.redirect(`/posts/${post._id}`)
        })
        .catch(next)
})

// GET /posts/create 
router.get('/create', checkLogin, function (req, res, next) {
    res.render('create')
})

// GET /posts/:postId
router.get('/:postId', function (req, res, next) {
    const postId = req.params.postId

    Promise.all([
            PostModel.getPostById(postId),
            CommentModel.getComments(postId),
            PostModel.incPv(postId)
        ])
        .then(function (result) {
            const post = result[0]
            const comments = result[1]
            if (!post) {
                throw new Error('The article does not exist')
            }

            res.render('post', {
                post: post,
                comments: comments
            })
        })
        .catch(next)
})

// GET /posts/:postId/edit
router.get('/:postId/edit', checkLogin, function (req, res, next) {
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getRawPostById(postId)
        .then(function (post) {
            if (!post) {
                throw new Error('The article does not exist')
            }
            if (author.toString() !== post.author._id.toString()) {
                throw new Error('Permission denied')
            }
            res.render('edit', {
                post: post
            })
        })
        .catch(next)
})

// POST /posts/:postId/edit
router.post('/:postId/edit', checkLogin, function (req, res, next) {
    const postId = req.params.postId
    const author = req.session.user._id
    const title = req.fields.title
    const content = req.fields.content


    try {
        if (!title.length) {
            throw new Error('Please input your title')
        }
        if (!content.length) {
            throw new Error('Please input your content')
        }
    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('back')
    }

    PostModel.getRawPostById(postId)
        .then(function (post) {
            if (!post) {
                throw new Error('The article does not exist')
            }
            if (post.author._id.toString() !== author.toString()) {
                throw new Error('Permission denied')
            }
            PostModel.updatePostById(postId, {
                    title: title,
                    content: content
                })
                .then(function () {
                    req.flash('success', 'Edit article successfully')

                    res.redirect(`/posts/${postId}`)
                })
                .catch(next)
        })
})

// GET /posts/:postId/remove
router.get('/:postId/remove', checkLogin, function (req, res, next) {
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getRawPostById(postId)
        .then(function (post) {
            if (!post) {
                throw new Error('The article does not exist')
            }
            if (post.author._id.toString() !== author.toString()) {
                throw new Error('Permission denied')
            }
            PostModel.delPostById(postId)
                .then(function () {
                    req.flash('success', 'Delete article successfully')

                    res.redirect('/posts')
                })
                .catch(next)
        })
})

module.exports = router