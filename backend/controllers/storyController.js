const { Story, User } = require('../models');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { caption, type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload media'
      });
    }

    // Determine resource type based on file mimetype
    const resourceType = type === 'video' ? 'video' : 'image';
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'stories', resourceType);

    const story = await Story.create({
      media: result.secure_url,
      type: resourceType,
      caption: caption || '',
      user: req.user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.populate('user', 'username profilePicture');

    res.status(201).json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get stories from followed users
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const followingIds = currentUser.following || [];
    
    // Get stories from followed users and own stories
    const stories = await Story.find({
      user: { $in: [...followingIds, req.user.id] },
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture name')
      .populate('viewers.user', 'username profilePicture name')
      .populate('likes', 'username profilePicture');

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false
        };
      }
      
      // Check if current user has viewed this story
      const hasViewed = story.viewers.some(
        viewer => viewer.user && viewer.user._id.toString() === req.user.id
      );
      
      if (!hasViewed && story.user._id.toString() !== req.user.id) {
        acc[userId].hasUnviewed = true;
      }
      
      acc[userId].stories.push({
        ...story.toObject(),
        hasViewed
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      stories: Object.values(groupedStories)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('viewers.user', 'username profilePicture');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    res.json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if already viewed
    const alreadyViewed = story.viewers.some(
      viewer => viewer.user.toString() === req.user.id
    );

    if (!alreadyViewed) {
      story.viewers.push({
        user: req.user.id,
        viewedAt: new Date()
      });
      await story.save();
    }

    res.json({
      success: true,
      message: 'Story marked as viewed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user owns the story
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }

    // Delete media from Cloudinary
    const publicId = extractPublicId(story.media);
    if (publicId) {
      await deleteFromCloudinary(publicId, story.type);
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's own stories
// @route   GET /api/stories/my-stories
// @access  Private
exports.getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user.id,
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate('viewers.user', 'username profilePicture');

    res.json({
      success: true,
      stories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Like/Unlike story
// @route   POST /api/stories/:id/like
// @access  Private
exports.likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if already liked using string comparison
    const isLiked = story.likes.some(like => like.toString() === req.user.id);

    if (isLiked) {
      // Unlike - remove user's like
      story.likes = story.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like - add user only if not already present
      if (!story.likes.some(like => like.toString() === req.user.id)) {
        story.likes.push(req.user.id);
      }
    }

    await story.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: story.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
