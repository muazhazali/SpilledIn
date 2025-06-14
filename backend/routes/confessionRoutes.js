const express = require('express')
const router = express.Router()
const confessionController = require('../controllers/confessionController');

router.post('/:user_id/image/upload', confessionController.uploadImageToSupabase);
router.post('/:user_id/confession/create', confessionController.createConfession);
router.delete('/:user_id/confession/delete', confessionController.deleteConfession);
router.post('/:user_id/confession/upvotedownvote', confessionController.applyVoteLogic);
module.exports = router;