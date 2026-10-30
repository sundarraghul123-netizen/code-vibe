const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  followUser,
  getSuggestedUsers,
  getSavedPosts,
  getFollowers,
  getFollowing,
  getUserPosts,
  getUserReels
} = require('../controllers/userController');
const { auth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes with optional auth
router.get('/profile/:username', optionalAuth, getUserProfile);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/posts', getUserPosts);
router.get('/:id/reels', getUserReels);

// Protected routes
router.put('/profile', auth, upload.single('profilePicture'), updateProfile);
router.post('/:id/follow', auth, followUser);
router.get('/suggested', auth, getSuggestedUsers);
router.get('/saved-posts', auth, getSavedPosts);

module.exports = router;
