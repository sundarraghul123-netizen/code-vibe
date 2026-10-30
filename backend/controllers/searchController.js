const { User, Post, Reel } = require('../models');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSearchQuery = (value) => {
  const query = String(value || '').trim().slice(0, 100);
  return {
    raw: query,
    regex: escapeRegex(query),
    hashtag: query.replace(/^#/, '').toLowerCase()
  };
};

// @desc    Search users by username
// @route   GET /api/search/users
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { raw, regex } = getSearchQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!raw) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: regex, $options: 'i' } },
        { name: { $regex: regex, $options: 'i' } },
        { bio: { $regex: regex, $options: 'i' } }
      ]
    })
      .select('username name profilePicture bio followers')
      .skip(skip)
      .limit(limit);
    
    console.log('Search users found:', users.length);

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: regex, $options: 'i' } },
        { name: { $regex: regex, $options: 'i' } },
        { bio: { $regex: regex, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search posts by hashtag or caption
// @route   GET /api/search/posts
// @access  Public
exports.searchPosts = async (req, res) => {
  try {
    const { raw, regex, hashtag } = getSearchQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const skip = (page - 1) * limit;

    if (!raw) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Check if searching by hashtag
    const isHashtag = raw.startsWith('#');
    const searchTerm = isHashtag ? hashtag : regex;

    let query = {};
    if (isHashtag) {
      query = { hashtags: searchTerm };
    } else {
      query = {
        $or: [
          { caption: { $regex: regex, $options: 'i' } },
          { hashtags: searchTerm }
        ]
      };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture');

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search reels by hashtag or caption
// @route   GET /api/search/reels
// @access  Public
exports.searchReels = async (req, res) => {
  try {
    const { raw, regex, hashtag } = getSearchQuery(req.query.q);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const skip = (page - 1) * limit;

    if (!raw) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Check if searching by hashtag
    const isHashtag = raw.startsWith('#');
    const searchTerm = isHashtag ? hashtag : regex;

    let query = {};
    if (isHashtag) {
      query = { hashtags: searchTerm };
    } else {
      query = {
        $or: [
          { caption: { $regex: regex, $options: 'i' } },
          { hashtags: searchTerm }
        ]
      };
    }

    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture');

    const total = await Reel.countDocuments(query);

    res.json({
      success: true,
      reels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/search/trending
// @access  Public
exports.getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate to find trending hashtags from posts
    const trendingHashtags = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { hashtag: '$_id', count: 1, _id: 0 } }
    ]);

    // Get trending posts (most liked recently)
    const trendingPosts = await Post.find()
      .sort({ likes: -1, createdAt: -1 })
      .limit(12)
      .populate('user', 'username profilePicture');

    // Get trending reels (most viewed recently)
    const trendingReels = await Reel.find()
      .sort({ views: -1, createdAt: -1 })
      .limit(12)
      .populate('user', 'username profilePicture');

    res.json({
      success: true,
      trending: {
        hashtags: trendingHashtags,
        posts: trendingPosts,
        reels: trendingReels
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
