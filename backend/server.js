const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const reelRoutes = require('./routes/reelRoutes');
const storyRoutes = require('./routes/storyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/upload');

// Database
const connectDB = require('./config/db');

// Socket
const { initializeSocket } = require('./sockets/socket');

const app = express();
const server = http.createServer(app);

// Render and other reverse proxies forward the original client address.
app.set('trust proxy', 1);

// Initialize Socket.io
initializeSocket(server);

// Security middleware
app.use(helmet());

// CORS - Allow local development and the configured production frontend.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    const isRenderOrigin = origin && /^https:\/\/[^/]+\.onrender\.com$/.test(origin);
    if (!origin || allowedOrigins.includes(origin) || isRenderOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Origin is not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Handle upload errors
app.use(handleUploadError);

// Error handler
app.use(errorHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server because MongoDB is unavailable:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections - don't crash the server
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  console.error(err.stack);
  // Don't exit - keep server running
});

// Handle uncaught exceptions - don't crash the server
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit - keep server running
});
