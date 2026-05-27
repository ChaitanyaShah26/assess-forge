import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { startWorker } from './queue/assessmentWorker.js';
import assignmentRoutes from './routes/assignment.js';
import classGroupRoutes from './routes/classGroup.js';
import toolkitRoutes from './routes/toolkit.js'; // RESOLVED: Missing import added cleanly

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Global CORS Middleware configuration
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Body parser configurations
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io bootstrapping
initSocket(server, CLIENT_URL);

// MongoDB Initializer
connectDB();

// API routing endpoint bindings
app.use('/api/assignments', assignmentRoutes);
app.use('/api/class-groups', classGroupRoutes);
app.use('/api/toolkit', toolkitRoutes); // Binds the specialized prompt microservices

// BullMQ background worker trigger
startWorker();

// Health Check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start listening for traffic
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` AssessForge Server Engine Live on Port: ${PORT}`);
  console.log(` Web client allowed: ${CLIENT_URL}`);
  console.log(`=============================================`);
});