const io = require('socket.io-client');


const socket = io('http://localhost:8000');


socket.emit('registerUser', { userId: '67c360b91d3e0b0f69c3b0a2' });


socket.on('newMessage', (message) => {
  console.log('new message:', message);
});

// الاستماع لتحديثات حالة القراءة
socket.on('messagesRead', (data) => {
  console.log('messages read:', data);
});
