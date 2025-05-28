const io = require('socket.io-client');

const MY_JWT    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzY3OTZjNjAxNDNmYTJmZmQyMTE2MiIsImlhdCI6MTc0ODQ1NjQ2MywiZXhwIjoxNzQ4NDYwMDYzfQ.QWudfiy4zQmgXS1kIUeq88IwhLhVdC6OjooRAu_G0OQ';
const OTHER_ID  = '6836796c60143fa2ffd21162'; 

// 2) Connect as “User A”
const socketA = io('http://localhost:3000', {
    auth: { token: MY_JWT }
});

socketA.on('connect', () => {
    console.log('A connected:', socketA.id);
    // send a message to OTHER_ID
    socketA.emit('send_message', {
        to:   OTHER_ID,
        text: 'Hello from A!'
    });
});

socketA.on('message_sent', ack => {
    console.log('A got ACK:', ack);
});

socketA.on('receive_message', msg => {
    console.log('A received:', msg);
});

socketA.on('connect_error', err => {
    console.error('A connect error:', err.message);
});
