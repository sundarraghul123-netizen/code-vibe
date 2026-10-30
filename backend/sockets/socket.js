const { Notification } = require('../models');

let io;
let onlineUsers = new Map();

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Broadcast online users
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    // Join conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stopTyping', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    // Handle new message
    socket.on('sendMessage', async (message) => {
      const { conversationId, receiverId } = message;
      
      // Broadcast to conversation room
      socket.to(conversationId).emit('receiveMessage', message);
      
      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessageNotification', message);
      }
    });

    // Handle message seen
    socket.on('messageSeen', ({ conversationId, messageId, senderId }) => {
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageSeen', {
          conversationId,
          messageId
        });
      }
    });

    // Handle story view
    socket.on('storyViewed', ({ storyId, ownerId }) => {
      const ownerSocketId = onlineUsers.get(ownerId);
      if (ownerSocketId) {
        io.to(ownerSocketId).emit('storyViewed', {
          storyId,
          viewerId: socket.userId
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  return io;
};

// Helper function to send notification via socket
const sendNotification = (receiverId, notification) => {
  if (io) {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newNotification', notification);
    }
  }
};

// Helper function to get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  initializeSocket,
  sendNotification,
  getOnlineUsers,
  isUserOnline,
  getIo: () => io
};
