const express = require('express')
const router = express.Router()
const confessionfeedController = require('../controllers/confessionfeedController');

router.get('/:id/feed', confessionfeedController.fetchConfession);
router.post('/:id/feed', confessionfeedController.deleteConfession);

module.exports = router;