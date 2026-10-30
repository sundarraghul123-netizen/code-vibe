const { Reel, User, Notification } = require('../models');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');

// @desc    Create a new reel
// @route   POST /api/reels
// @access  Private
exports.createReel = async (req, res) => {
  try {
    const { caption } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video'
      });
    }

    // Upload video to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'reels', 'video');

    // Extract hashtags from caption
    const hashtags = caption ? caption.match(/#[\w]+/g) || [] : [];
    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());

    const reel = await Reel.create({
      video: result.secure_url,
      thumbnail: result.thumbnail_url || result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
      caption: caption || '',
      hashtags: cleanHashtags,
      duration: result.duration || 0,
      user: req.user.id
    });

    await reel.populate('user', 'username profilePicture');

    res.status(201).json({
      success: true,
      reel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all reels
// @route   GET /api/reels
// @access  Public
exports.getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    const total = await Reel.countDocuments();

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

// @desc    Get single reel
// @route   GET /api/reels/:id
// @access  Public
exports.getReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.json({
      success: true,
      reel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete reel
// @route   DELETE /api/reels/:id
// @access  Private
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if user owns the reel
    if (reel.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reel'
      });
    }

    // Delete video from Cloudinary
    const publicId = extractPublicId(reel.video);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'video');
    }

    await reel.deleteOne();

    res.json({
      success: true,
      message: 'Reel deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Like/Unlike reel
// @route   POST /api/reels/:id/like
// @access  Private
exports.likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if already liked using string comparison
    const isLiked = reel.likes.some(like => like.toString() === req.user.id);

    if (isLiked) {
      // Unlike - remove user's like
      reel.likes = reel.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like - add user only if not already present
      if (!reel.likes.some(like => like.toString() === req.user.id)) {
        reel.likes.push(req.user.id);
        
        // Create notification (don't notify self)
        if (reel.user.toString() !== req.user.id) {
          await Notification.create({
            type: 'like',
            sender: req.user.id,
            receiver: reel.user,
            reel: reel._id
          });
        }
      }
    }

    await reel.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: reel.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add comment to reel
// @route   POST /api/reels/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const comment = {
      user: req.user.id,
      text,
      createdAt: new Date()
    };

    reel.comments.push(comment);
    await reel.save();

    // Create notification (don't notify self)
    if (reel.user.toString() !== req.user.id) {
      await Notification.create({
        type: 'comment',
        sender: req.user.id,
        receiver: reel.user,
        reel: reel._id,
        comment: text
      });
    }

    await reel.populate('comments.user', 'username profilePicture');

    res.status(201).json({
      success: true,
      comment: reel.comments[reel.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete comment from reel
// @route   DELETE /api/reels/:id/comment/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const comment = reel.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or the reel
    if (
      comment.user.toString() !== req.user.id &&
      reel.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    reel.comments = reel.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    await reel.save();

    res.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
