const { User, Post, Reel, Notification } = require('../models');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinary');
const { sendNotification } = require('../sockets/socket');

// @desc    Get user profile by username
// @route   GET /api/users/profile/:username
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -resetPasswordToken -resetPasswordExpire -email')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get post count
    const postCount = await Post.countDocuments({ user: user._id });

    // Check if current user is following this user
    let isFollowing = false;
    let canChat = false;
    if (req.user) {
      isFollowing = user.followers.some(
        follower => follower._id.toString() === req.user.id
      );
      // Check if mutual follow (can chat)
      const currentUser = await User.findById(req.user.id);
      canChat = isFollowing && currentUser.following.includes(user._id) && user.following.includes(req.user.id);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        postCount,
        isFollowing,
        canChat,
        createdAt: user.createdAt
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { bio, username, name } = req.body;
    const updateData = {};

    // Check if username is being changed and if it's already taken
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updateData.username = username;
    }

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if it exists and is not the default
      if (req.user.profilePicture && !req.user.profilePicture.includes('default-avatar')) {
        const publicId = extractPublicId(req.user.profilePicture);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
        }
      }

      // Upload new profile picture
      const result = await uploadToCloudinary(req.file.buffer, 'profile-pictures', 'image');
      updateData.profilePicture = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== req.params.id
      );
      userToFollow.followers = userToFollow.followers.filter(
        id => id.toString() !== req.user.id
      );
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
      
      // Create notification (don't notify self)
      if (req.params.id !== req.user.id) {
        const notification = await Notification.create({
          type: 'follow',
          sender: req.user.id,
          receiver: userToFollow._id
        });
        
        // Send socket notification
        await notification.populate('sender', 'username profilePicture');
        sendNotification(req.params.id, notification);
      }
    }

    await currentUser.save();
    await userToFollow.save();

    // Check if mutual follow (can chat)
    const isMutual = !isFollowing && 
      userToFollow.following.includes(req.user.id) &&
      currentUser.following.includes(req.params.id);

    res.json({
      success: true,
      isFollowing: !isFollowing,
      isMutual,
      canChat: isMutual || (currentUser.following.includes(req.params.id) && userToFollow.following.includes(req.user.id)),
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get users that current user is not following
    const followingIds = currentUser.following || [];
    const suggestedUsers = await User.find({
      _id: { 
        $nin: [...followingIds, currentUser._id] 
      }
    })
      .select('username name profilePicture bio followers')
      .limit(10);

    res.json({
      success: true,
      users: suggestedUsers
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get saved posts
// @route   GET /api/users/saved-posts
// @access  Private
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedPosts',
        populate: {
          path: 'user',
          select: 'username profilePicture'
        }
      });

    res.json({
      success: true,
      posts: user.savedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username profilePicture bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      followers: user.followers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username profilePicture bio');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      following: user.following
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/users/:id/posts
// @access  Public
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    const total = await Post.countDocuments({ user: req.params.id });

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

// @desc    Get user's reels
// @route   GET /api/users/:id/reels
// @access  Public
exports.getUserReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const reels = await Reel.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    const total = await Reel.countDocuments({ user: req.params.id });

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
