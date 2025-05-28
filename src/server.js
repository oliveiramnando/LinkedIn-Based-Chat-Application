require('dotenv').config();

// ─── Env-vars sanity check ─────────────────────────────────────────────────
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.SESSION_SECRET) {
    console.error('Missing required env vars');
    process.exit(1);
}

// ─── Imports ────────────────────────────────────────────────────────────────
const express       = require('express');
const session       = require('express-session');
const http          = require('http');
const mongoose      = require('mongoose');
const jwt           = require('jsonwebtoken');
const { Server }    = require('socket.io');
const passport      = require('passport');

const Message       = require('./models/message');
const authRoutes    = require('./routes/auth');
require('./config/passport')(passport);

// ─── App & Server Setup ───────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: { origin: '*' } // replace '*' with your frontend URL in production
});

// ─── Middleware ────────────────────────────────────────────────────────────
// parse JSON bodies
app.use(express.json());

// session support for OAuth state
app.use(session({ 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// catch malformed JSON payloads
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Invalid JSON payload:', err);
        return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    next();
});

// helper to secure HTTP routes with JWT
function authenticateJWT(req, res, next) { 
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.id;
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// ─── Routes ────────────────────────────────────────────────────────────────
// LinkedIn OAuth endpoints
app.use('/auth', authRoutes);

// health check
app.get('/', (req, res) => res.json({ status: 'OK' }));

// get chat history between two users
app.get('/messages/:userId', authenticateJWT, async (req, res) => {
    const otherUserId = req.params.userId;
    try { 
        const messages = await Message.find({
            $or: [
                { sender: req.userId,  receiver: otherUserId },
                { sender: otherUserId,  receiver: req.userId }
            ]
        })
        .sort({ timestamp: 1 }); // oldest first, newest last
        return res.json(messages);
    } catch (err) {
        console.error('Error fetching chat history:', err);
        return res.status(500).json({ message: 'Error fetching chat history' });
    }
});

// send a new message
app.post('/messages', authenticateJWT, async (req, res) => {
    const { to, content } = req.body;
    if (!to || !content) {
        return res.status(400).json({ message: 'Both "to" and "content" are required' });
    }
    try {
        const now = new Date();
        const msg = new Message({
            sender:    req.userId,
            receiver:  to,
            content:   content,
            timestamp: now
        });
        await msg.save();

        io.to(`user:${to}`).emit('receive_message', {
            sender:    req.userId,
            content:   content,
            timestamp: now
        });
        return res.status(201).json(msg);
    } catch (err) {
        console.error('Error saving message:', err);
        return res.status(500).json({ message: 'Error sending message' });
    }
});

// ─── Error Handling ────────────────────────────────────────────────────────
// 404 for unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (res.headersSent) return next(err);
    const status  = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ message });
});

// ─── Socket.IO Setup ──────────────────────────────────────────────────────
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

// handle real-time chat events
io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('send_message', async ({ to, text }) => {
        const now = new Date();
        const msg = new Message({
            sender:    socket.userId,
            receiver:  to,
            content:   text,
            timestamp: now
        });
        await msg.save();

        io.to(`user:${to}`).emit('receive_message', {
            sender:    socket.userId,
            content:   text,
            timestamp: now
        });
        socket.emit('message_sent', {
            to,
            content:   text,
            timestamp: now
        });
    });
});

// ─── Database Connection ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// ─── Server Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
