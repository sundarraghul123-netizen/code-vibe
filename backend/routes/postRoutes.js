const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  savePost,
  addComment,
  deleteComment
} = require('../controllers/postController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', auth, upload.single('image'), createPost);
router.get('/feed', auth, getFeedPosts);
router.get('/explore', getExplorePosts);
router.get('/:id', getPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/save', auth, savePost);
router.post('/:id/comment', auth, addComment);
router.delete('/:id/comment/:commentId', auth, deleteComment);

module.exports = router;
