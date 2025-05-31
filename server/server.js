require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Database connection with options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/facebook-helpdesk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('Connected to MongoDB');
  // Start server only after DB connection is established
  const PORT = process.env.PORT || 5001;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Routes (to be implemented)
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
app.use('/api/facebook', require('./routes/facebook'));
app.use('/webhook', require('./fb-webhook'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
}); 