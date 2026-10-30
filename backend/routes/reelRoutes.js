const express = require('express');
const router = express.Router();
const {
  createReel,
  getReels,
  getReel,
  deleteReel,
  likeReel,
  addComment,
  deleteComment
} = require('../controllers/reelController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', auth, upload.single('video'), createReel);
router.get('/', getReels);
router.get('/:id', getReel);
router.delete('/:id', auth, deleteReel);
router.post('/:id/like', auth, likeReel);
router.post('/:id/comment', auth, addComment);
router.delete('/:id/comment/:commentId', auth, deleteComment);

module.exports = router;
