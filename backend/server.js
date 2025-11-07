// Load environment variables from .env file
import 'dotenv/config';

import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { initializeFirebase } from './src/config/firebase.js';
import { db as adminDb, rtdb } from './src/config/firebaseConfig.js';

// Import API routes
import taskRoutes from './src/routes/taskRoutes.js';

import authRoutes from './src/routes/authRoutes.js';
import matchmakingRoutes from './src/routes/matchmakingRoutes.js';
// --- Firebase Admin SDK Initialization ---
initializeFirebase();

// --- Express App Setup ---
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// --- Global Middlewares ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Enable parsing of JSON request bodies
app.use(express.json());
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/match', matchmakingRoutes);
// --- API Routes ---
// A simple health check endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount the task-related routes under the /api/v1/tasks prefix
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/auth', authRoutes);

// --- Socket.io Signaling Server ---
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend's URL
  },
});

io.on("connection", (socket) => {
  console.log("✅ User connected to signaling server:", socket.id);

  // --- Room and WebRTC Signaling Events ---
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    // Differentiate between video and chat joins if needed in the future
    console.log(`User ${socket.id} (userId: ${userId}) joined room ${roomId}`);
    // Notify others in the room that a user has joined (for WebRTC)
    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", data.candidate);
  });

  socket.on("emoji-reaction", (data) => {
    socket.to(data.roomId).emit("emoji-reaction", { icon: data.icon });
  });

  socket.on("leave-room", (roomId, userId) => {
    console.log(`User ${socket.id} (userId: ${userId}) left room ${roomId}`);
    socket.to(roomId).emit("user-left", { userId, socketId: socket.id });
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in socket.rooms) {
      if (socket.rooms.hasOwnProperty(roomId) && roomId !== socket.id) {
        socket.to(roomId).emit("user-left", socket.id);
      }
    }
  });

  // --- Chat Message Event ---
  socket.on("send-message", async (data) => {
    const { roomId, message } = data;
    if (!roomId || !message) return;

    try {
      const messagesRef = rtdb.ref(`rooms/${roomId}/messages`);
      const newMessageRef = await messagesRef.push(message);
      // The `onValue` listener on the frontend will handle displaying the new message.
      // No need to emit back here, as it can cause duplicates.
    } catch (error) {
      console.error("Error saving message to RTDB:", error);
    }
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`✅ API and Signaling Server is running on http://localhost:${PORT}`);
});