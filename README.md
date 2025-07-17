# Role-based Chat Backend (Node.js)

This project provides a simple backend server where **players** and **fans** can register, authenticate, and chat with one another in real time. Chat is only permitted **between different roles** (i.e., *fan ↔ player*). Same-role communication is blocked.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Socket.io for real-time communication
- JSON Web Tokens (JWT) for auth
- bcrypt for password hashing

## Setup

1. **Clone & install**

```bash
git clone <repo-url>
cd role-chat-backend
npm install
```

2. **Environment variables**

Create a `.env` file and set **at minimum**:

```
# Mongo connection string – local or Atlas
MONGO_URI=mongodb://localhost:27017/roleChatDB
# Secret used to sign / verify JWTs
JWT_SECRET=yourSuperSecretHere
# Port to run the HTTP & WebSocket server
PORT=3000
```

3. **Run the server**

```bash
npm run dev   # nodemon
# or
npm start
```

Server is now running on `http://localhost:3000`.

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user *(name, email, password, role)* |
| POST | `/api/auth/login` | Login, returns `{ token }` |
| GET | `/api/chat/conversation/:userId` | Get conversation with specific user (requires Bearer token) |
| GET | `/api/chat/online` | Users who logged in within the last hour |

### Auth Headers

```
Authorization: Bearer <JWT_TOKEN>
```

## Real-time Socket.io Usage

An out-of-the-box tester page is served by the backend itself:

```
http://localhost:3000/test
```

Open it in two tabs (one fan token, one player token) to see live messages and presence.  
If you prefer to code manually, here is the minimal client snippet:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: jwtToken,
  },
});

// Send
socket.emit('privateMessage', { receiverId, message: 'Hello!' });

// Receive
socket.on('privateMessage', (msg) => {
  console.log(msg);
});
```

Socket events:

- `privateMessage` – 2-way chat event
- `userOnline` / `userOffline` – presence updates

## Postman Collection

A ready-made Postman collection is provided in `docs/role-chat.postman_collection.json`. Import it to test the APIs easily.

---

MIT License 