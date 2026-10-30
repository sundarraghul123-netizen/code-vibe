import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessageContext';

const Messages = () => {
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef(null);
  const { socket, onlineUsers, joinConversation, leaveConversation } = useSocket();
  const { user } = useAuth();
  const { markConversationAsRead } = useMessages();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      joinConversation(conversationId);
      
      // Mark conversation as read
      markConversationAsRead(conversationId);
      
      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [conversationId, socket, joinConversation, leaveConversation, markConversationAsRead]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
        setMessages((prev) => (
          prev.some((item) => item._id === message._id) ? prev : [...prev, message]
        ));
      };
      socket.on('receiveMessage', handleReceiveMessage);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      setMessages([]);
      const response = await chatAPI.getMessages(id);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return lastSeen.toLocaleDateString();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !conversationId || sending) return;

    try {
      setSending(true);
      setSendError('');
      // Get receiver from conversations
      const conv = conversations.find(c => c._id === conversationId);
      if (!conv) throw new Error('Conversation is not ready yet');

      const response = await chatAPI.sendMessage({
        conversationId,
        receiverId: conv.otherUser.id,
        message: text
      });

      // Add message to list
      setMessages((prev) => (
        prev.some((item) => item._id === response.data.message._id)
          ? prev
          : [...prev, response.data.message]
      ));
      
      // Update conversations via MessageContext
      const updatedConversations = conversations.map(c =>
        c._id === conversationId 
          ? { ...c, lastMessage: response.data.message }
          : c
      );
      setConversations(updatedConversations);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError(error.response?.data?.message || 'Message could not be sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              to={`/messages/${conv._id}`}
              className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                conversationId === conv._id ? 'bg-gray-50 dark:bg-gray-800' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={conv.otherUser.profilePicture}
                  alt={conv.otherUser.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {onlineUsers.includes(conv.otherUser._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`truncate ${conv.unreadCount > 0 ? 'font-bold text-black dark:text-white' : 'font-semibold'}`}>
                    {conv.otherUser.username}
                  </p>
                  {onlineUsers.includes(conv.otherUser._id) ? (
                    <span className="text-xs text-green-500 font-medium">Active now</span>
                  ) : conv.lastMessage?.createdAt ? (
                    <span className="text-xs text-gray-400">{formatLastSeen(conv.lastMessage.createdAt)}</span>
                  ) : null}
                </div>
                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-black dark:text-white' : 'text-gray-500'}`}>
                  {conv.lastMessage?.message || 'No messages yet'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {conversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
              {(() => {
                const conv = conversations.find(c => c._id === conversationId);
                if (!conv) return null;
                return (
                  <>
                    <div className="relative">
                      <img
                        src={conv.otherUser.profilePicture}
                        alt={conv.otherUser.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {onlineUsers.includes(conv.otherUser._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold">{conv.otherUser.username}</h2>
                      {onlineUsers.includes(conv.otherUser._id) ? (
                        <p className="text-xs text-green-500 font-medium">Active now</p>
                      ) : conv.lastMessage?.createdAt ? (
                        <p className="text-xs text-gray-400">{formatLastSeen(conv.lastMessage.createdAt)}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Offline</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender._id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      msg.sender._id === user?.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  maxLength={2000}
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full outline-none dark:bg-gray-800"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-primary-500 text-white rounded-full disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              {sendError && <p className="mt-2 text-sm text-red-500">{sendError}</p>}
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
