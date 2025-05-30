const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  pageId: {
    type: String,
    required: true,
  },
  senderId: { 
    type: String,
    required: true,
  },
  senderName: String, 
  senderPicture: String, 
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Conversation', conversationSchema); 