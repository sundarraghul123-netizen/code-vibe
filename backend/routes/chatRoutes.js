const express = require('express');
const router = express.Router();
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteMessage
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, createConversation);
router.get('/messages/:conversationId', auth, getMessages);
router.post('/messages', auth, upload.single('media'), sendMessage);
router.delete('/messages/:messageId', auth, deleteMessage);

module.exports = router;
