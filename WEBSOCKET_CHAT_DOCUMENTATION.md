# WebSocket Chat Implementation Documentation

## Overview
This document describes the WebSocket-based chat functionality that has been integrated into the graduation project. The implementation uses Socket.IO for real-time communication between radiologists and radiology centers.

## Features Implemented

### 1. Real-time Messaging
- Instant message delivery when users are online
- Message broadcasting to conversation rooms
- Individual user notifications for offline users

### 2. Typing Indicators
- Real-time typing status updates
- Automatic timeout for typing indicators

### 3. Message Status
- Read receipts when messages are marked as read
- Delivery confirmations
- Unread message counts

### 4. User Status
- Online/offline status tracking
- Last seen timestamps
- Status updates broadcast to all users

### 5. Conversation Rooms
- Dedicated rooms for each conversation pair
- Consistent room naming for bidirectional conversations
- Room-based message broadcasting

## WebSocket Events

### Client to Server Events

#### `userOnline`
Establishes user connection and sets online status.
```javascript
socket.emit('userOnline', {
    userId: 'user123',
    userType: 'Radiologist' // or 'RadiologyCenter'
});
```

#### `joinChat`
Joins a specific conversation room.
```javascript
socket.emit('joinChat', {
    userId: 'user123',
    userType: 'Radiologist',
    partnerId: 'partner456',
    partnerType: 'RadiologyCenter'
});
```

#### `leaveChat`
Leaves a specific conversation room.
```javascript
socket.emit('leaveChat', {
    userId: 'user123',
    userType: 'Radiologist',
    partnerId: 'partner456',
    partnerType: 'RadiologyCenter'
});
```

#### `typing`
Sends typing indicator to conversation partner.
```javascript
socket.emit('typing', {
    userId: 'user123',
    userType: 'Radiologist',
    partnerId: 'partner456',
    partnerType: 'RadiologyCenter',
    isTyping: true
});
```

#### `messageDelivered`
Confirms message delivery (optional).
```javascript
socket.emit('messageDelivered', {
    messageId: 'msg123',
    userId: 'user123',
    userType: 'Radiologist'
});
```

#### `updateStatus`
Updates user status.
```javascript
socket.emit('updateStatus', {
    userId: 'user123',
    userType: 'Radiologist',
    status: 'online' // or 'offline', 'busy', etc.
});
```

### Server to Client Events

#### `newMessage`
Notifies about new messages.
```javascript
socket.on('newMessage', (data) => {
    console.log('New message:', data.message);
    console.log('Total unread count:', data.totalUnreadCount);
    console.log('Sender unread count:', data.senderUnreadCount);
});
```

#### `messagesRead`
Notifies when messages are marked as read.
```javascript
socket.on('messagesRead', (data) => {
    console.log('Messages read by:', data.partnerId);
    console.log('Conversation room:', data.conversationRoomId);
});
```

#### `userTyping`
Notifies about typing status.
```javascript
socket.on('userTyping', (data) => {
    console.log('User typing:', data.userId, data.isTyping);
});
```

#### `userStatusUpdate`
Notifies about user status changes.
```javascript
socket.on('userStatusUpdate', (data) => {
    console.log('Status update:', data.userId, data.status);
});
```

#### `rich_notification`
Notifies about system notifications.
```javascript
socket.on('rich_notification', (notification) => {
    console.log('Notification:', notification.title, notification.message);
});
```

#### `initialNotifications`
Sends initial unread notifications on connection.
```javascript
socket.on('initialNotifications', (notifications) => {
    console.log('Initial notifications:', notifications);
});
```

## API Endpoints

The existing REST API endpoints work alongside WebSocket functionality:

### Send Message
```
POST /api/messages/send
```
Body:
```json
{
    "senderId": "user123",
    "senderType": "Radiologist",
    "receiverId": "partner456",
    "receiverType": "RadiologyCenter",
    "content": "Hello, how are you?",
    "attachments": []
}
```

### Get Conversation
```
GET /api/messages/conversation?userId=user123&userType=Radiologist&partnerId=partner456&partnerType=RadiologyCenter
```

### Mark Messages as Read
```
POST /api/messages/markRead
```
Body:
```json
{
    "userId": "user123",
    "userType": "Radiologist",
    "partnerId": "partner456",
    "partnerType": "RadiologyCenter"
}
```

### Get Unread Count
```
GET /api/messages/unread?userId=user123&userType=Radiologist
```

## Implementation Details

### Server Configuration
- WebSocket server runs on the same port as HTTP server (3000)
- CORS configured for multiple origins
- Connection timeout: 60 seconds
- Ping interval: 25 seconds

### Room Management
- Each conversation gets a unique room ID
- Room ID format: `chat_{userId1}_{userType1}_{userId2}_{userType2}`
- Users are sorted alphabetically to ensure consistent room naming

### Message Broadcasting
- Messages are broadcast to conversation rooms
- Individual notifications sent to online users
- Offline users receive notifications when they come online

### Database Integration
- Message storage in MongoDB using existing Message model
- User status updates in Radiologist model
- Notification storage in Notification model

## Client Implementation

### Basic Setup
```javascript
const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling']
});

// Connect user
socket.emit('userOnline', {
    userId: 'your-user-id',
    userType: 'Radiologist'
});

// Join chat
socket.emit('joinChat', {
    userId: 'your-user-id',
    userType: 'Radiologist',
    partnerId: 'partner-id',
    partnerType: 'RadiologyCenter'
});
```

### Message Handling
```javascript
// Listen for new messages
socket.on('newMessage', (data) => {
    displayMessage(data.message);
    updateUnreadCount(data.totalUnreadCount);
});

// Send message via API
async function sendMessage(content) {
    const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: 'your-user-id',
            senderType: 'Radiologist',
            receiverId: 'partner-id',
            receiverType: 'RadiologyCenter',
            content: content
        })
    });
    return response.json();
}
```

## Testing

### Using the Example Client
1. Open `websocket-chat-example.html` in a browser
2. Enter user credentials and connect
3. Join a chat with a partner
4. Send messages and observe real-time updates

### Manual Testing
1. Start the server: `npm start`
2. Connect multiple clients
3. Test message sending, typing indicators, and read receipts
4. Verify offline/online status updates

## Security Considerations

- User authentication should be implemented for production
- Validate user permissions before joining conversations
- Rate limiting for message sending
- Input validation for all message content

## Performance Considerations

- Message history is loaded via REST API, not WebSocket
- WebSocket is used only for real-time updates
- Connection pooling for multiple users
- Efficient room management

## Troubleshooting

### Common Issues
1. **Connection fails**: Check CORS settings and server URL
2. **Messages not received**: Verify room joining and user online status
3. **Typing indicators not working**: Check event emission timing
4. **Status updates not reflecting**: Verify database connection

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=socket.io:*
```

## Future Enhancements

1. File sharing in chat
2. Message encryption
3. Message search functionality
4. Chat history pagination
5. Voice/video calling integration
6. Message reactions and emojis
7. Group chat functionality
8. Message threading

## Files Modified

- `controllers/Massage.controller.js` - Updated for WebSocket integration
- `middleware/notfi.js` - Enhanced with chat-specific events
- `server.js` - WebSocket initialization
- `websocket-chat-example.html` - Client example
- `WEBSOCKET_CHAT_DOCUMENTATION.md` - This documentation

## Dependencies

- `socket.io`: ^4.8.1 (already installed)
- `socket.io-client`: ^4.8.1 (already installed)

The WebSocket chat functionality is now fully integrated and ready for use!
