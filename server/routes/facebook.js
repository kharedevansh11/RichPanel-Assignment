const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message'); 
const axios = require('axios');

const router = express.Router();

const FACEBOOK_GRAPH_API_VERSION = process.env.FACEBOOK_APP_VERSION || 'v18.0';

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}

// POST /api/facebook/connect
router.post(
  '/connect',
  auth,
  [
    body('id').notEmpty(),
    body('name').notEmpty(),
    body('accessToken').notEmpty(),
    body('picture').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findByIdAndUpdate(
        req.user,
        { fbPage: req.body },
        { new: true }
      );

      try {
        await axios.post(
          `https://graph.facebook.com/${req.body.id}/subscribed_apps`,
          { subscribed_fields: 'messages,messaging_postbacks,message_deliveries,message_reads' },
          {
            params: { access_token: req.body.accessToken },
          }
        );
        console.log(`Successfully subscribed page ${req.body.name} (${req.body.id}) to webhook events.`);
      } catch (webhookErr) {
        console.error('Error subscribing page to webhook:', webhookErr.response?.data || webhookErr);

      }

      res.json({ fbPage: user.fbPage });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/facebook/connect
router.get('/connect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    console.log('GET /api/facebook/connect - user.fbPage:', user.fbPage);
    res.json({ fbPage: user.fbPage });
  } catch (err) {
    console.error('Error fetching Facebook connection status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/facebook/connect
router.delete('/connect', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user,
      { $unset: { fbPage: 1 } },
      { new: true }
    );
    res.json({ fbPage: null });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations
router.get('/conversations', auth, async (req, res) => {
  try {

    const conversations = await Conversation.find({ user: req.user }).sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/facebook/conversations/:conversationId/messages
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;


    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId: conversationId }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/facebook/messages
router.post(
  '/messages',
  auth,
  [
    body('conversationId').notEmpty().withMessage('Conversation ID is required'),
    body('text').notEmpty().withMessage('Message text is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { conversationId, text } = req.body;

    try {

      const conversation = await Conversation.findOne({ _id: conversationId, user: req.user }).populate('user');

      if (!conversation || !conversation.user || !conversation.user.fbPage || !conversation.user.fbPage.accessToken) {
        return res.status(404).json({ message: 'Conversation or connected page not found' });
      }

      const pageAccessToken = conversation.user.fbPage.accessToken;
      const recipientId = conversation.senderId;
      const pageId = conversation.pageId;


      const graphApiResponse = await axios.post(
        `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${pageId}/messages`,
        {
          recipient: { id: recipientId },
          message: { text: text },
        },
        {
          params: { access_token: pageAccessToken },
        }
      );


      const sentMessage = new Message({
        conversationId: conversation._id,
        senderId: pageId,
        text: text,
        timestamp: new Date(),
        isEcho: true,
      });
      await sentMessage.save();


      conversation.lastMessageAt = sentMessage.timestamp;
      await conversation.save();

      console.log('Message sent via Graph API and saved:', sentMessage);

      res.status(201).json({ message: 'Message sent successfully!', sentMessage });

    } catch (error) {
      console.error('Error sending message via Graph API:', error);
      if (error.response) {
        console.error('Graph API Error Response Data:', error.response.data);
        console.error('Graph API Error Response Status:', error.response.status);
      }
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
);

module.exports = router; 