const { Post, User, Notification } = require('../models');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');
const { sendNotification } = require('../sockets/socket');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { caption, location } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'posts', 'image');

    // Extract hashtags from caption
    const hashtags = caption ? caption.match(/#[\w]+/g) || [] : [];
    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());

    const post = await Post.create({
      image: result.secure_url,
      caption: caption || '',
      hashtags: cleanHashtags,
      location: location || '',
      user: req.user.id
    });

    await post.populate('user', 'username profilePicture');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get feed posts (from followed users)
// @route   GET /api/posts/feed
// @access  Private
exports.getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get posts from followed users and own posts
    const followingIds = currentUser.following || [];
    const posts = await Post.find({
      user: { $in: [...followingIds, req.user.id] }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture name')
      .populate('comments.user', 'username profilePicture name');

    const total = await Post.countDocuments({
      user: { $in: [...followingIds, req.user.id] }
    });

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
    console.error('Get feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all posts (explore)
// @route   GET /api/posts/explore
// @access  Public
exports.getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1, likes: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture');

    const total = await Post.countDocuments();

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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture')
      .populate('likes', 'username profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update post caption
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    // Extract hashtags from caption
    const hashtags = caption ? caption.match(/#[\w]+/g) || [] : [];
    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { caption, hashtags: cleanHashtags },
      { new: true, runValidators: true }
    ).populate('user', 'username profilePicture');

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete image from Cloudinary
    const publicId = extractPublicId(post.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'image');
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked using string comparison
    const isLiked = post.likes.some(like => like.toString() === req.user.id);

    if (isLiked) {
      // Unlike - remove user's like
      post.likes = post.likes.filter(
        like => like.toString() !== req.user.id
      );
    } else {
      // Like - add user only if not already present
      if (!post.likes.some(like => like.toString() === req.user.id)) {
        post.likes.push(req.user.id);
      }
      
      // Create notification (don't notify self)
      if (post.user.toString() !== req.user.id) {
        const notification = await Notification.create({
          type: 'like',
          sender: req.user.id,
          receiver: post.user,
          post: post._id
        });
        
        // Send socket notification
        await notification.populate('sender', 'username profilePicture');
        await notification.populate('post', 'image');
        sendNotification(post.user.toString(), notification);
      }
    }

    await post.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Save/Unsave post
// @route   POST /api/posts/:id/save
// @access  Private
exports.savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(
        id => id.toString() !== req.params.id
      );
    } else {
      // Save
      user.savedPosts.push(req.params.id);
    }

    await user.save();

    res.json({
      success: true,
      isSaved: !isSaved,
      message: isSaved ? 'Post unsaved' : 'Post saved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user.id,
      text,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Create notification (don't notify self)
    if (post.user.toString() !== req.user.id) {
      const notification = await Notification.create({
        type: 'comment',
        sender: req.user.id,
        receiver: post.user,
        post: post._id,
        comment: text
      });
      
      // Send socket notification
      await notification.populate('sender', 'username profilePicture');
      await notification.populate('post', 'image');
      sendNotification(post.user.toString(), notification);
    }

    await post.populate('comments.user', 'username profilePicture');

    res.status(201).json({
      success: true,
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or the post
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    post.comments = post.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    await post.save();

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
