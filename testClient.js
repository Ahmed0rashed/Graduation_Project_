const io = require('socket.io-client');


const socket = io('http://localhost:8000');


socket.emit('registerUser', { userId: '67c72055bae8c7428a7e6e0e' });


socket.on('newMessage', (message) => {
  console.log('new message:', message);
});

// الاستماع لتحديثات حالة القراءة
socket.on('messagesRead', (data) => {
  console.log('messages read:', data);
});
