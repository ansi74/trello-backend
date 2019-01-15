const router = require('express').Router()
const { Column } = require('../controllers')

router.post('/column/add', Column.add)
router.post('/column/list', Column.list)
router.post('/column/transfer', Column.transfer)
router.post('/column/edit', Column.edit)
router.post('/column/delete', Column.delete)

module.exports = router
