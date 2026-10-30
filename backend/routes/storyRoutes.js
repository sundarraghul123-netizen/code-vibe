const express = require('express');
const router = express.Router();
const {
  createStory,
  getStories,
  getStory,
  viewStory,
  deleteStory,
  getMyStories,
  likeStory
} = require('../controllers/storyController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', auth, upload.single('media'), createStory);
router.get('/', auth, getStories);
router.get('/my-stories', auth, getMyStories);
router.get('/:id', auth, getStory);
router.post('/:id/view', auth, viewStory);
router.post('/:id/like', auth, likeStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
