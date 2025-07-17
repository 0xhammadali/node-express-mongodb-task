require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret, port } = require('./config/config');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// Connect to DB
connectDB();

const PORT = port;
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store online users
authenticatedUsers = new Map();
//Client logs in and receives a JWT token.
io.use(async (socket, next) => {
  try {//Client connects to the WebSocket with the token in socket.handshake.auth.token.
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    //verifying the token
    const decoded = jwt.verify(token, jwtSecret);
    socket.user = decoded;

    // Mark user online in DB
    await User.findByIdAndUpdate(decoded.id, { online: true });
    next();
  } catch (err) {
    console.error(err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
    //saves the user id in the map
  const userId = socket.user.id;
  authenticatedUsers.set(userId, socket.id);
  io.emit('userOnline', userId);

  socket.on('privateMessage', async ({ receiverId, message }) => {
    console.log("privateMessage",receiverId,message);
    try {
      if (!receiverId || !message) return;

      const sender = await User.findById(userId);
      const receiver = await User.findById(receiverId);
      if (!sender || !receiver) return;

      // Ensure different roles
      if (sender.role === receiver.role) {
        socket.emit('error', 'Chat not allowed between same roles');
        return;
      }

      const msgDoc = await Message.create({
        sender: userId,
        receiver: receiverId,
        message,
      });

      // Emit to sender
      socket.emit('privateMessage', msgDoc);

      // Emit to receiver if online
      const receiverSocketId = authenticatedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('privateMessage', msgDoc);
      }
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Internal server error');
    }
  });

  socket.on('disconnect', async () => {
    authenticatedUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { online: false });
    io.emit('userOffline', userId);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 