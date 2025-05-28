# LinkedIn-Based-Chat-Application

A Node.js + Express backend that enables LinkedIn OAuth 2.0 login, real-time messaging with Socket.IO, and MongoDB persistence.

---

## Features

- LinkedIn OAuth 2.0 authentication with Passport.js  
- JWT authentication for REST and WebSocket endpoints  
- Real-time chat powered by Socket.IO  
- MongoDB storage (Users & Messages) via Mongoose  
- Graceful error handling and input validation  

---

## Prerequisites

- Node.js v16+ and npm (or Yarn)  
- A MongoDB database (Atlas or local)  
- A LinkedIn Developer application with **Sign In with LinkedIn** enabled  

---

## Setup & Example API Requests

```bash
# 1. Clone the repository
git clone https://github.com/your-username/linkedin-chat-backend.git
cd linkedin-chat-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Then edit .env and fill in:
# BASE_URL=http://localhost:3000
# PORT=3000
# MONGODB_URI=YOUR_MONGODB_URI
# JWT_SECRET=your_jwt_signing_secret
# SESSION_SECRET=your_express_session_secret
# LINKEDIN_CLIENT_ID=your_linkedin_app_client_id
# LINKEDIN_CLIENT_SECRET=your_linkedin_app_client_secret

# 4. Whitelist your IP and callback URL
# - MongoDB Atlas → Network Access: add your IP or 0.0.0.0/0 (for testing).
# - LinkedIn Developer Portal → Auth Settings: add
#   http://localhost:3000/auth/linkedin/callback
#   as an authorized redirect URL.

# 5. Run the server
node src/server.js
# You should see:
# Server running on port 3000
# MongoDB connected

# Example API Requests

## 1. Obtain a JWT
curl http://localhost:3000/auth/linkedin

## 2. Send a Message
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "to":      "<RECIPIENT_USER_ID>",
    "content": "Hello from curl!"
  }'

## 3. Retrieve Chat History
curl http://localhost:3000/messages/<OTHER_USER_ID> \
  -H "Authorization: Bearer <YOUR_JWT>"
