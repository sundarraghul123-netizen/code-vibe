const mongoose = require('mongoose');

const reelCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const reelSchema = new mongoose.Schema({
  video: {
    type: String,
    required: [true, 'Video is required']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    default: ''
  },
  hashtags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [reelCommentSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  audio: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reelSchema.index({ user: 1, createdAt: -1 });
reelSchema.index({ createdAt: -1 });
reelSchema.index({ hashtags: 1 });

// Virtual for like count
reelSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
reelSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

module.exports = mongoose.model('Reel', reelSchema);
