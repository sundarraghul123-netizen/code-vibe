import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const readConversationIds = useRef(new Set());
  const { socket } = useSocket();
  const { isAuthenticated, user } = useAuth();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      const fetchedConversations = response.data.conversations.map((conversation) => (
        readConversationIds.current.has(conversation._id)
          ? { ...conversation, unreadCount: 0 }
          : conversation
      ));
      setConversations(fetchedConversations);
      // Calculate total unread messages
      const totalUnread = fetchedConversations.reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  useEffect(() => {
    if (socket && user) {
      // Listen for new messages
      socket.on('newMessage', (message) => {
        // Only increment if message is from someone else
        const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
        if (senderId !== user.id) {
          setUnreadCount((prev) => prev + 1);
          // Update conversations
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv._id === message.conversationId) {
                return { ...conv, unreadCount: (conv.unreadCount || 0) + 1 };
              }
              return conv;
            });
          });
        }
      });

      // Listen for message seen
      socket.on('messageSeen', ({ conversationId }) => {
        setConversations((prev) => {
          return prev.map((conv) => {
            if (conv._id === conversationId) {
              const newCount = Math.max(0, (conv.unreadCount || 0) - 1);
              return { ...conv, unreadCount: newCount };
            }
            return conv;
          });
        });
        // Recalculate total
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      return () => {
        socket.off('newMessage');
        socket.off('messageSeen');
      };
    }
  }, [socket, user]);

  const markConversationAsRead = useCallback((conversationId) => {
    readConversationIds.current.add(conversationId);
    setConversations((prev) => {
      const conv = prev.find((c) => c._id === conversationId);
      if (conv) {
        const unreadInConv = conv.unreadCount || 0;
        setUnreadCount((count) => Math.max(0, count - unreadInConv));
        return prev.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        );
      }
      return prev;
    });
  }, []);

  const value = {
    conversations,
    unreadCount,
    loading,
    fetchConversations,
    markConversationAsRead,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};
