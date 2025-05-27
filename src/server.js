require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const passport = require('passport');
const Message = require('./models/message');

const authRoutes = require('./routes/auth');
require('./config/passport')(passport);

const app = express();
app.use(passport.initialize());
app.use('/auth', authRoutes);
app.get('/', (req, res) => res.json({ status: 'OK' }));

mongoose.connect(process.env.MONGODB_URI, { // connecting to mongdb
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } // replace '*' with frontend url
});

// authenticate each incoming socket connection
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.id;
        return next();
    } catch {
        return next(new Error('Authentication error'));
    }
});

// handles new websocket connections and defines chat behavior
io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('send_message', async ({ to, text }) => {
        const now = new Date();

        const msg = new Message({
            sender: socket.userId,
            receiver: to,
            content: text,
            timestamp: now
        });
        await msg.save();

        io.to(`user:${to}`).emit('receive_message', {
            sender: socket.userId,
            content: text,
            timestamp: now
        });

        socket.emit('message_sent', {
            to,
            content: text,
            timestamp: now
        });
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
