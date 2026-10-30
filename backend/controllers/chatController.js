const { Conversation, Message, User } = require('../models');
const { uploadToCloudinary, extractPublicId } = require('../utils/cloudinary');
const { getIo } = require('../sockets/socket');

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'username profilePicture')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Format conversations to include other user info
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== req.user.id
      );
      const unreadCount = conv.unreadCount?.get(req.user.id.toString()) || 0;
      
      return {
        _id: conv._id,
        otherUser,
        lastMessage: conv.lastMessage,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Start or get conversation with a user
// @route   POST /api/chat/conversations
// @access  Private
exports.createConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    }).populate('participants', 'username profilePicture');

    if (conversation) {
      const otherUser = conversation.participants.find(
        p => p._id.toString() !== req.user.id
      );
      
      return res.json({
        success: true,
        conversation: {
          _id: conversation._id,
          otherUser,
          lastMessage: conversation.lastMessage,
          updatedAt: conversation.updatedAt
        }
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user.id, userId]
    });

    await conversation.populate('participants', 'username profilePicture');

    const otherUser = conversation.participants.find(
      p => p._id.toString() !== req.user.id
    );

    res.status(201).json({
      success: true,
      conversation: {
        _id: conversation._id,
        otherUser,
        lastMessage: null,
        updatedAt: conversation.updatedAt
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

// @desc    Get messages in a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');

    // Mark messages as seen
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user.id,
        seen: false
      },
      { seen: true, seenAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCount.set(req.user.id.toString(), 0);
    await conversation.save();

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({
      success: true,
      messages: messages.reverse(),
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

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message, receiverId } = req.body;

    // Verify conversation exists and user is part of it
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this conversation'
      });
    }

    let mediaUrl = null;
    let mediaType = null;

    // Handle media upload
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video');
      const result = await uploadToCloudinary(
        req.file.buffer,
        'chat-media',
        isVideo ? 'video' : 'image'
      );
      mediaUrl = result.secure_url;
      mediaType = isVideo ? 'video' : 'image';
    }

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      receiver: receiverId,
      message: message || '',
      media: mediaUrl,
      mediaType,
      seen: false
    });

    await newMessage.populate('sender', 'username profilePicture');
    await newMessage.populate('receiver', 'username profilePicture');

    // Update conversation
    conversation.lastMessage = newMessage._id;
    
    // Increment unread count for receiver
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Deliver the persisted message in real time. The client deduplicates by
    // message id so it is safe whether the socket event or HTTP response wins.
    getIo()?.to(conversationId).emit('receiveMessage', newMessage);
    getIo()?.to(conversationId).emit('newMessage', newMessage);

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
