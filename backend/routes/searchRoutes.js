const express = require('express');
const router = express.Router();
const {
  searchUsers,
  searchPosts,
  searchReels,
  getTrending
} = require('../controllers/searchController');

router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/reels', searchReels);
router.get('/trending', getTrending);

module.exports = router;
