# Facebook Helpdesk - Interview Project

## Project Overview

This is a full-stack MERN application that serves as a Facebook Messenger management platform for businesses. The application allows companies to efficiently manage their Facebook Messenger conversations through a unified dashboard, making it easier for teams to handle customer communications.

Dashboard:<img width="1438" alt="image" src="https://github.com/user-attachments/assets/2ceeca0e-f445-45b3-8154-375b2c0986dd" />

### Problem Statement
Companies like Amazon receive thousands of Facebook messages daily, making it challenging to manage and distribute workload among team members directly through Facebook's interface. This application solves this problem by providing a centralized platform where teams can:
- Connect their Facebook pages
- View all incoming messages
- Share workload among team members
- Reply to messages efficiently

## Key Features

1. **User Management**
   - Secure registration and login system
   - JWT-based authentication
   - Protected routes and API endpoints

2. **Facebook Integration**
   - Facebook OAuth integration
   - Page connection management
   - Webhook subscription for real-time messages
   - Permission management for pages and messenger

3. **Conversation Management**
   - Real-time message updates
   - Smart conversation threading (24-hour rule)
   - Customer profile information
   - Message history tracking

4. **Modern UI/UX**
   - Clean, responsive interface using Tailwind CSS
   - Real-time updates
   - Intuitive conversation management
   - Customer profile sidebar

## Technical Implementation

### Frontend (React.js)
- React for UI components
- Tailwind CSS for styling
- Facebook SDK integration
- Axios for API communication
- React Router for navigation
- Context API for state management

### Backend (Node.js/Express)
- RESTful API architecture
- MongoDB with Mongoose for data modeling
- Facebook Graph API integration
- Webhook handling for real-time updates
- JWT authentication
- Socket.io for real-time features

## Project Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Facebook Developer Account
- Facebook App with Messenger Platform enabled

### Environment Variables

1. **Server (.env)**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/facebook-helpdesk

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h

# Facebook App
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Webhook
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

2. **Client (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
```

### Installation Steps

1. **Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/yourusername/facebook-helpdesk.git
cd facebook-helpdesk

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Database Setup**
```bash
# Start MongoDB (if running locally)
mongod

# Create database and collections
# MongoDB will create these automatically when the app runs
```

3. **Facebook App Setup**
- Create a Facebook Developer account
- Create a new app in Facebook Developers Console
- Enable Messenger Platform
- Configure Webhook URL
- Add necessary permissions:
  - pages_messaging
  - pages_read_engagement
  - pages_show_list
  - pages_manage_metadata

4. **Start the Application**
```bash
# Start the server (from server directory)
npm run dev

# Start the client (from client directory)
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/facebook - Facebook OAuth
- GET /api/auth/facebook/callback - Facebook OAuth callback

### Facebook Integration
- POST /api/facebook/connect - Connect Facebook page
- DELETE /api/facebook/disconnect - Disconnect Facebook page
- GET /api/facebook/pages - Get connected pages

### Messages
- GET /api/messages - Get all conversations
- GET /api/messages/:conversationId - Get specific conversation
- POST /api/messages/:conversationId - Send message
- GET /api/webhook - Facebook webhook verification
- POST /api/webhook - Facebook webhook events

## Database Schema

### User
```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  fbPage: {
    id: String,
    name: String,
    accessToken: String,
    picture: String
  }
}
```

### Conversation
```javascript
{
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
}
```
### Message
```javascript
{
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: {
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
}
```
## Testing the Application

1. **Register a new account**
2. **Connect Facebook Page**
   - Click "Connect Facebook Page"
   - Authorize the application
   - Select the page to connect
3. **Test Message Flow**
   - Send a message to your Facebook page
   - Verify it appears in the dashboard
   - Reply to the message
   - Verify the reply is sent to Facebook
