const router = require('express').Router()
const { Card } = require('../controllers')

router.post('/card/add', Card.add)
router.post('/card/list', Card.list)
router.post('/card/edit', Card.edit)
router.post('/card/delete', Card.delete)
router.post('/card/transfer', Card.transfer)

module.exports = router
