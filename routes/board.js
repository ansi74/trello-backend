const router = require('express').Router()
const { Board } = require('../controllers')

router.post('/board/check', Board.check)

module.exports = router
