const express = require('express');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const User = require('./models/User'); 
const axios = require('axios'); //

const router = express.Router();

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'fb_helpdesk_verify_token'; 
const FACEBOOK_GRAPH_API_VERSION = process.env.FACEBOOK_APP_VERSION || 'v18.0'; 

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle incoming messages
router.post('/', async (req, res) => {
  const body = req.body;
  const io = req.app.get('io'); // Get Socket.io instance

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const webhookEvent of entry.messaging) {
        console.log('Webhook Event:', webhookEvent);

        // Process only incoming messages from users
        if (webhookEvent.message && !webhookEvent.message.is_echo) {
          const senderId = webhookEvent.sender.id; 
          const pageId = webhookEvent.recipient.id; 
          const messageText = webhookEvent.message.text; 
          const timestamp = new Date(webhookEvent.timestamp); 

          try {
            // Find the user who owns this page
            const ownerUser = await User.findOne({ 'fbPage.id': pageId });
            if (!ownerUser || !ownerUser.fbPage || !ownerUser.fbPage.accessToken) {
              console.log(`User not found or page access token missing for page ID: ${pageId}`);
              continue; 
            }

            // Find existing conversation
            let conversation = await Conversation.findOne({
              pageId: pageId,
              senderId: senderId,
              user: ownerUser._id,
            });

            const twentyFourHoursAgo = new Date(timestamp.getTime() - (24 * 60 * 60 * 1000));

            if (conversation && conversation.lastMessageAt < twentyFourHoursAgo) {
              console.log('Last message > 24h ago, creating new conversation.');
              conversation = null; 
            }

          
            if (!conversation) {
              let senderName = 'Unknown Sender';
              let senderPicture = '';

              try {
               
                const graphApiUrl = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${senderId}`;
                console.log('Fetching sender info:', graphApiUrl, { fields: 'name,profile_pic' });
                const graphApiResponse = await axios.get(
                  graphApiUrl,
                  {
                    params: {
                      fields: 'name,profile_pic',
                      access_token: ownerUser.fbPage.accessToken,
                    },
                  }
                );
                console.log('Graph API Response (Sender Info):', graphApiResponse.data);
                senderName = graphApiResponse.data.name || senderName;
                senderPicture = typeof graphApiResponse.data.profile_pic === 'string' 
                  ? graphApiResponse.data.profile_pic
                  : '';
                console.log(`Fetched sender info: ${senderName}, Picture: ${senderPicture}`)

              } catch (graphError) {
                console.error('Error fetching sender info from Graph API:', graphError.message);
             
                if (graphError.response) {
                    console.error('Graph API Error Response Data:', graphError.response.data);
                    console.error('Graph API Error Response Status:', graphError.response.status);
                }
              }

              conversation = new Conversation({
                pageId: pageId,
                senderId: senderId,
                user: ownerUser._id,
                lastMessageAt: timestamp,
                senderName: senderName,
                senderPicture: senderPicture,
              });
            } else {
             
              conversation.lastMessageAt = timestamp;
            }

           
            await conversation.save();

          
            const message = new Message({
              conversationId: conversation._id,
              senderId: senderId,
              text: messageText,
              timestamp: timestamp,
              isEcho: false,
            });

            await message.save();

            // Emit socket event for new message
            io.emit('newMessage', {
              conversationId: conversation._id,
              message: {
                senderId: senderId,
                text: messageText,
                timestamp: timestamp,
                isEcho: false
              }
            });

            // Emit socket event for conversation update
            io.emit('conversationUpdate', {
              conversationId: conversation._id,
              lastMessageAt: timestamp,
              senderName: conversation.senderName,
              senderPicture: conversation.senderPicture
            });

            console.log('Message processed and saved/updated.');

          } catch (error) {
            console.error('Error processing webhook event and saving data:', error);
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

module.exports = router; 