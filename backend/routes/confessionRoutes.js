const express = require('express')
const router = express.Router()
const confessionController = require('../controllers/confessionController');

router.post('/:user_id/image/upload', confessionController.uploadImageToSupabase);
router.post('/:user_id/confession/create', confessionController.createConfession);

module.exports = router;