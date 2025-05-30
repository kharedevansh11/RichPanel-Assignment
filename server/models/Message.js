const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: { // Facebook sender ID 
    type: String,
    required: true,
  },
  text: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isEcho: { 
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Message', messageSchema); 