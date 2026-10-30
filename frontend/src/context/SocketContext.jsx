import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// In production the socket server is the same origin as the API server.
// Deriving this URL keeps local development working while preventing the
// deployed build from trying to connect to the user's localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join', user.id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('joinConversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('leaveConversation', conversationId);
    }
  };

  const sendMessage = (message) => {
    if (socket) {
      socket.emit('sendMessage', message);
    }
  };

  const sendTyping = (conversationId, receiverId) => {
    if (socket) {
      socket.emit('typing', { conversationId, receiverId });
    }
  };

  const stopTyping = (conversationId, receiverId) => {
    if (socket) {
      socket.emit('stopTyping', { conversationId, receiverId });
    }
  };

  const markMessageSeen = (conversationId, messageId, senderId) => {
    if (socket) {
      socket.emit('messageSeen', { conversationId, messageId, senderId });
    }
  };

  const viewStory = (storyId, ownerId) => {
    if (socket) {
      socket.emit('storyViewed', { storyId, ownerId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    stopTyping,
    markMessageSeen,
    viewStory,
    isUserOnline: (userId) => onlineUsers.includes(userId),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
