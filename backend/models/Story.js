const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  media: {
    type: String,
    required: [true, 'Story media is required']
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  caption: {
    type: String,
    maxlength: [100, 'Caption cannot exceed 100 characters'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TTL Index - automatically delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ createdAt: -1 });

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.viewers ? this.viewers.length : 0;
});

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

module.exports = mongoose.model('Story', storySchema);
