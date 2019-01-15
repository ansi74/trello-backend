const router = require('express').Router()

router.use(require('./board'))
router.use(require('./column'))
router.use(require('./card'))

module.exports = router
