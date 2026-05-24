import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import { startWorker } from './queue/assessmentWorker.js';
import assignmentRoutes from './routes/assignment.js';
import classGroupRoutes from './routes/classGroup.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initSocket(server, CLIENT_URL);

connectDB();

app.use('/api/assignments', assignmentRoutes);

startWorker();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.use('/api/assignments', assignmentRoutes);
app.use('/api/class-groups', classGroupRoutes);

server.listen(PORT, () => {
  console.log(` AssessForge Server Engine Live on Port: ${PORT}`);
  console.log(` Web client allowed: ${CLIENT_URL}`);
});